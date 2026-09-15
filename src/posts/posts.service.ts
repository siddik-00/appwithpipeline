import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Like } from '../entities/like.entity';
import { Bookmark } from '../entities/bookmark.entity';
import { Comment } from '../entities/comment.entity';
import { Notification } from '../entities/notification.entity';
import { fmtDateTime, publicUser } from '../common/util';
import { httpBadge } from '../common/config';
import { AuthService } from '../auth/auth.service';

export type CommentDict = {
  id: number;
  content: string;
  time: string;
  author: Record<string, unknown> | null;
  can_delete: boolean;
};

export type PostDict = {
  id: number;
  content: string;
  gradient: string;
  image: string | null;
  time: string;
  author: Record<string, unknown> | null;
  liked: boolean;
  reaction: string;
  like_count: number;
  bookmarked: boolean;
  shared: Record<string, unknown> | null;
  comments: CommentDict[];
};

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Like) private readonly likes: Repository<Like>,
    @InjectRepository(Bookmark)
    private readonly bookmarks: Repository<Bookmark>,
    @InjectRepository(Comment)
    private readonly comments: Repository<Comment>,
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    private readonly auth: AuthService,
  ) {}

  private async buildComments(post: Post, user: User | null): Promise<CommentDict[]> {
    const rows = await this.comments.find({
      where: { post_id: post.id },
      order: { created_at: 'ASC' },
    });
    const result: CommentDict[] = [];
    for (const c of rows) {
      const author = await this.users.findOne({ where: { id: c.user_id } });
      result.push({
        id: c.id,
        content: c.content,
        time: fmtDateTime(new Date(c.created_at)),
        author: publicUser(author),
        can_delete: !!(
          user &&
          (c.user_id === user.id || post.user_id === user.id)
        ),
      });
    }
    return result;
  }

  async buildPosts(posts: Post[], user: User | null): Promise<PostDict[]> {
    if (!posts.length) return [];
    const ids = posts.map((p) => p.id);
    const postsById = new Map(posts.map((p) => [p.id, p]));
    const userIds = [...new Set(posts.map((p) => p.user_id))];
    const userRows = await this.users.find({ where: { id: In(userIds) } });
    const usersById = new Map(userRows.map((u) => [u.id, u]));

    let myLikes = new Map<number, Like>();
    if (user) {
      const rows = await this.likes.find({
        where: { post_id: In(ids), user_id: user.id },
      });
      myLikes = new Map(rows.map((l) => [l.post_id, l]));
    }

    const likeRows = await this.likes.find({ where: { post_id: In(ids) } });
    const likeCounts = new Map<number, number>();
    for (const l of likeRows) {
      likeCounts.set(l.post_id, (likeCounts.get(l.post_id) || 0) + 1);
    }

    let myMarks = new Set<number>();
    if (user) {
      const rows = await this.bookmarks.find({
        where: { post_id: In(ids), user_id: user.id },
      });
      myMarks = new Set(rows.map((b) => b.post_id));
    }

    const commentRows = await this.comments.find({
      where: { post_id: In(ids) },
      order: { created_at: 'ASC' },
    });
    const commentUserIds = [...new Set(commentRows.map((c) => c.user_id))];
    const commentUserRows = commentUserIds.length
      ? await this.users.find({ where: { id: In(commentUserIds) } })
      : [];
    const commentUsers = new Map(commentUserRows.map((u) => [u.id, u]));
    const commentsByPost = new Map<number, CommentDict[]>();
    for (const c of commentRows) {
      const author = commentUsers.get(c.user_id);
      const entry: CommentDict = {
        id: c.id,
        content: c.content,
        time: fmtDateTime(new Date(c.created_at)),
        author: publicUser(author || null),
        can_delete: !!(
          user &&
          (c.user_id === user.id ||
            postsById.get(c.post_id)?.user_id === user.id)
        ),
      };
      if (!commentsByPost.has(c.post_id)) commentsByPost.set(c.post_id, []);
      commentsByPost.get(c.post_id)!.push(entry);
    }

    const parentIds = [...new Set(posts.filter((p) => p.parent_id).map((p) => p.parent_id!))];
    const parents = parentIds.length
      ? await this.posts.find({ where: { id: In(parentIds) } })
      : [];
    const parentMap = new Map(parents.map((p) => [p.id, p]));
    const parentAuthorIds = [...new Set(parents.map((p) => p.user_id))];
    const parentAuthorRows = parentAuthorIds.length
      ? await this.users.find({ where: { id: In(parentAuthorIds) } })
      : [];
    const parentAuthors = new Map(parentAuthorRows.map((u) => [u.id, u]));

    return posts.map((p) => {
      const myLike = myLikes.get(p.id);
      let shared: Record<string, unknown> | null = null;
      if (p.parent_id && parentMap.has(p.parent_id)) {
        const par = parentMap.get(p.parent_id)!;
        shared = {
          id: par.id,
          content: par.content,
          gradient: par.gradient,
          image: par.image || null,
          time: fmtDateTime(new Date(par.created_at)),
          author: publicUser(parentAuthors.get(par.user_id) || null),
        };
      }
      return {
        id: p.id,
        content: p.content,
        gradient: p.gradient,
        image: p.image || null,
        time: fmtDateTime(new Date(p.created_at)),
        author: publicUser(usersById.get(p.user_id) || null),
        liked: !!myLike,
        reaction: myLike ? myLike.reaction : '',
        like_count: likeCounts.get(p.id) || 0,
        bookmarked: myMarks.has(p.id),
        shared,
        comments: commentsByPost.get(p.id) || [],
      };
    });
  }

  async buildPost(p: Post, user: User | null): Promise<PostDict> {
    const built = await this.buildPosts([p], user);
    return built[0];
  }

  async createPost(body: Record<string, unknown>, token?: string) {
    const user = await this.auth.requireUser(token);
    const content = ((body.content as string) || '').trim();
    if (!content) httpBadge(HttpStatus.BAD_REQUEST, 'Post content required');
    const gradient = (body.gradient as string) || '';
    const image = ((body.image as string) || '').trim() || null;
    const post = this.posts.create({
      user_id: user.id,
      content,
      gradient: gradient || 'linear-gradient(135deg,#6200EE,#D397FA)',
      image,
    });
    const saved = await this.posts.save(post);
    return this.buildPost(saved, user);
  }

  async editPost(postId: number, body: Record<string, unknown>, token?: string) {
    const user = await this.auth.requireUser(token);
    const post = await this.posts.findOne({ where: { id: postId } });
    if (!post) httpBadge(HttpStatus.NOT_FOUND, 'Post not found');
    if (post!.user_id !== user.id)
      httpBadge(HttpStatus.FORBIDDEN, 'You can only edit your own posts');
    const content = ((body.content as string) || '').trim();
    if (!content) httpBadge(HttpStatus.BAD_REQUEST, 'Post content required');
    const gradient = (body.gradient as string) || '';
    post!.content = content;
    post!.gradient = gradient || post!.gradient;
    const saved = await this.posts.save(post!);
    return this.buildPost(saved, user);
  }

  async deletePost(postId: number, token?: string) {
    const user = await this.auth.requireUser(token);
    const post = await this.posts.findOne({ where: { id: postId } });
    if (!post) httpBadge(HttpStatus.NOT_FOUND, 'Post not found');
    if (post!.user_id !== user.id)
      httpBadge(HttpStatus.FORBIDDEN, 'You can only delete your own posts');
    await this.likes.delete({ post_id: postId });
    await this.comments.delete({ post_id: postId });
    await this.bookmarks.delete({ post_id: postId });
    await this.posts.delete({ parent_id: postId });
    await this.posts.delete(postId);
    return { ok: true };
  }

  async toggleLike(postId: number, body: Record<string, unknown>, token?: string) {
    const user = await this.auth.requireUser(token);
    const post = await this.posts.findOne({ where: { id: postId } });
    if (!post) httpBadge(HttpStatus.NOT_FOUND, 'Post not found');
    const reaction = (body?.reaction as string) || 'like';
    const existing = await this.likes.findOne({
      where: { post_id: postId, user_id: user.id },
    });
    let liked = true;
    if (existing) {
      if (existing.reaction === reaction) {
        await this.likes.delete(existing.id);
        liked = false;
      } else {
        existing.reaction = reaction;
        await this.likes.save(existing);
      }
    } else {
      await this.likes.save(
        this.likes.create({
          post_id: postId,
          user_id: user.id,
          reaction,
        }),
      );
      const author = await this.users.findOne({ where: { id: post!.user_id } });
      if (author && author.id !== user.id) {
        await this.notifications.save(
          this.notifications.create({
            user_id: author.id,
            actor_id: user.id,
            type: 'like',
            message: `${user.name || user.username} reacted ${reaction} to your post`,
          }),
        );
      }
    }
    const likeCount = await this.likes.count({ where: { post_id: postId } });
    return { liked, like_count: likeCount, reaction };
  }

  async sharePost(postId: number, token?: string) {
    const user = await this.auth.requireUser(token);
    const original = await this.posts.findOne({ where: { id: postId } });
    if (!original) httpBadge(HttpStatus.NOT_FOUND, 'Post not found');
    const rootId = original.parent_id || original.id;
    const share = this.posts.create({
      user_id: user.id,
      parent_id: rootId,
      content: '',
      gradient: original.gradient,
    });
    const saved = await this.posts.save(share);
    return this.buildPost(saved, user);
  }

  async toggleBookmark(postId: number, token?: string) {
    const user = await this.auth.requireUser(token);
    const post = await this.posts.findOne({ where: { id: postId } });
    if (!post) httpBadge(HttpStatus.NOT_FOUND, 'Post not found');
    const existing = await this.bookmarks.findOne({
      where: { post_id: postId, user_id: user.id },
    });
    let saved = true;
    if (existing) {
      await this.bookmarks.delete(existing.id);
      saved = false;
    } else {
      await this.bookmarks.save(
        this.bookmarks.create({ post_id: postId, user_id: user.id }),
      );
    }
    return { bookmarked: saved };
  }

  async addComment(postId: number, body: Record<string, unknown>, token?: string) {
    const user = await this.auth.requireUser(token);
    const post = await this.posts.findOne({ where: { id: postId } });
    if (!post) httpBadge(HttpStatus.NOT_FOUND, 'Post not found');
    const content = ((body.content as string) || '').trim();
    if (!content) httpBadge(HttpStatus.BAD_REQUEST, 'Comment required');
    const comment = await this.comments.save(
      this.comments.create({ post_id: postId, user_id: user.id, content }),
    );
    const author = await this.users.findOne({ where: { id: post!.user_id } });
    if (author && author.id !== user.id) {
      await this.notifications.save(
        this.notifications.create({
          user_id: author.id,
          actor_id: user.id,
          type: 'comment',
          message: `${user.name || user.username} commented on your post`,
        }),
      );
    }
    return {
      id: comment.id,
      content: comment.content,
      time: fmtDateTime(new Date(comment.created_at)),
      author: publicUser(user),
    };
  }

  async editComment(commentId: number, body: Record<string, unknown>, token?: string) {
    const user = await this.auth.requireUser(token);
    const comment = await this.comments.findOne({ where: { id: commentId } });
    if (!comment) httpBadge(HttpStatus.NOT_FOUND, 'Comment not found');
    if (comment!.user_id !== user.id)
      httpBadge(HttpStatus.FORBIDDEN, 'You can only edit your own comments');
    const content = ((body.content as string) || '').trim();
    if (!content) httpBadge(HttpStatus.BAD_REQUEST, 'Comment required');
    comment!.content = content;
    const saved = await this.comments.save(comment!);
    return {
      id: saved.id,
      content: saved.content,
      time: fmtDateTime(new Date(saved.created_at)),
      author: publicUser(user),
    };
  }

  async deleteComment(commentId: number, token?: string) {
    const user = await this.auth.requireUser(token);
    const comment = await this.comments.findOne({ where: { id: commentId } });
    if (!comment) httpBadge(HttpStatus.NOT_FOUND, 'Comment not found');
    const post = await this.posts.findOne({ where: { id: comment!.post_id } });
    if (comment!.user_id !== user.id && !(post && post.user_id === user.id))
      httpBadge(HttpStatus.FORBIDDEN, 'You can only delete your own comments');
    await this.comments.delete(commentId);
    return { ok: true };
  }
}