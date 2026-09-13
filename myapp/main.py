from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4

from fastapi import Body, Cookie, Depends, FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pwdlib import PasswordHash
from sqlalchemy import func
from sqlmodel import Session, select

from myapp.db import engine
from myapp.models import (
    Bookmark,
    Comment,
    Follow,
    Like,
    Message,
    Notification,
    Post,
    Story,
    StoryView,
    User,
)

password_hash = PasswordHash.recommended()
TEMPLATES = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))

SESSIONS: dict[str, str] = {}
AVATAR_COLORS = [
    "#6200EE",
    "#006EFF",
    "#00D68F",
    "#F89B29",
    "#FF0F7B",
    "#06b6d4",
    "#8b5cf6",
]


def seed_demo_data():
    with Session(engine) as db:
        if db.exec(select(User)).first():
            return
        demo_users = [
            {
                "username": "masud",
                "first_name": "Masud",
                "last_name": "Rahman",
                "name": "Masud Rahman",
                "bio": "Building StarConnect Asia",
                "email": "masud@starconnect.app",
                "phone": "+880 1711-000001",
                "profession": "Founder & CEO",
                "address": "Gulshan, Dhaka",
                "country": "Bangladesh",
                "website": "starconnect.app",
                "avatar_color": "#6200EE",
                "online": True,
                "verified": True,
            },
            {
                "username": "nusrat",
                "first_name": "Nusrat",
                "last_name": "Jahan",
                "name": "Nusrat Jahan",
                "bio": "Expert in digital marketing",
                "email": "nusrat@marketing.io",
                "phone": "+880 1711-000002",
                "profession": "Digital Marketing Expert",
                "address": "Dhaka",
                "country": "Bangladesh",
                "website": "nusrat.digital",
                "avatar_color": "#FF0F7B",
                "online": False,
                "verified": True,
            },
            {
                "username": "tanvir",
                "first_name": "Tanvir",
                "last_name": "Ahmed",
                "name": "Tanvir Ahmed",
                "bio": "Full-stack developer",
                "email": "tanvir@dev.io",
                "phone": "+880 1711-000003",
                "profession": "Full-stack Developer",
                "address": "Sylhet",
                "country": "Bangladesh",
                "website": "tanvir.dev",
                "avatar_color": "#006EFF",
                "online": False,
                "verified": False,
            },
            {
                "username": "sadia",
                "first_name": "Sadia",
                "last_name": "Islam",
                "name": "Sadia Islam",
                "bio": "Career advisor | Mentor",
                "email": "sadia@career.com",
                "phone": "+880 1711-000004",
                "profession": "Career Advisor & Mentor",
                "address": "Rajshahi",
                "country": "Bangladesh",
                "website": "sadia.career",
                "avatar_color": "#00D68F",
                "online": False,
                "verified": True,
            },
        ]
        posts_by_username = {
            "masud": [
                "We are hiring! Looking for passionate developers to join our team. 🌟",
                "Thankful to our amazing community for the constant support and feedback! 🙌",
                "Big milestone reached for StarConnect. The journey is just beginning!",
            ],
            "nusrat": [
                "5 marketing tips that instantly boosted engagement for my clients 📈",
                "Morning routine of top performers: 30 min reading + 10 min planning.",
            ],
            "tanvir": [
                "Just shipped a new FastAPI feature. Async + SQLModel is such a smooth combo!",
                "Learned something today: 'Don't fear the refactor. Fear the bug you ignore.'",
            ],
            "sadia": [
                "Vernacular languages are the future of online learning in South Asia.",
                "Don't wait for the perfect moment. Start small, build momentum.",
            ],
        }
        users = {}
        for d in demo_users:
            u = User(
                username=d["username"],
                password_hash=password_hash.hash("starconnect"),
                first_name=d["first_name"],
                last_name=d["last_name"],
                name=d["name"],
                bio=d["bio"],
                email=d["email"],
                phone=d["phone"],
                profession=d["profession"],
                address=d["address"],
                country=d["country"],
                website=d["website"],
                avatar_color=d["avatar_color"],
                verified=d["verified"],
                online=d["online"],
            )
            db.add(u)
            db.flush()
            users[d["username"]] = u

        created = datetime.now()
        order = [
            ("masud", 0),
            ("nusrat", 0),
            ("tanvir", 0),
            ("sadia", 0),
            ("masud", 1),
            ("nusrat", 1),
        ]
        all_posts = []
        minute = 5
        for username, idx in order:
            u = users[username]
            content = posts_by_username[username][idx]
            p = Post(
                user_id=u.id,
                content=content,
                created_at=created.replace(hour=10, minute=minute),
            )
            db.add(p)
            db.flush()
            all_posts.append(p)
            minute += 5

        # likes
        like_sets = [
            (users["nusrat"].id, all_posts[0].id),
            (users["tanvir"].id, all_posts[0].id),
            (users["sadia"].id, all_posts[0].id),
            (users["masud"].id, all_posts[2].id),
            (users["sadia"].id, all_posts[4].id),
        ]
        for uid, pid in like_sets:
            db.add(Like(post_id=pid, user_id=uid, reaction="like", created_at=created))

        # comments
        comments = [
            (
                users["nusrat"].id,
                all_posts[0].id,
                "Congrats Masud, this is amazing! 🎉",
            ),
            (
                users["tanvir"].id,
                all_posts[0].id,
                "I would love to join. Let's grow together 🚀",
            ),
            (users["masud"].id, all_posts[1].id, "Very useful tips, thank you Nusrat!"),
        ]
        for uid, pid, text in comments:
            db.add(Comment(post_id=pid, user_id=uid, content=text, created_at=created))

        # follows
        for follower in list(users.values()):
            for target in list(users.values()):
                if follower.id != target.id:
                    db.add(Follow(follower_id=follower.id, following_id=target.id))

        # notifications for masud (demo default login)
        db.add(
            Notification(
                user_id=users["masud"].id,
                actor_id=users["nusrat"].id,
                type="like",
                message="Nusrat Jahan liked your post",
                created_at=created,
            )
        )
        db.add(
            Notification(
                user_id=users["masud"].id,
                actor_id=users["tanvir"].id,
                type="follow",
                message="Tanvir Ahmed started following you",
                created_at=created,
            )
        )

        # stories
        stories = [
            (
                "masud",
                "Big announcement coming! 🔥",
                "linear-gradient(135deg,#6200EE,#D397FA)",
            ),
            ("nusrat", "Daily tip below 👇", "linear-gradient(135deg,#FF0F7B,#F89B29)"),
            ("tanvir", "Coding at night 💻", "linear-gradient(135deg,#006EFF,#00D68F)"),
            ("sadia", "Career Q&A today!", "linear-gradient(135deg,#8B5CF6,#EC4899)"),
        ]
        for username, content, grad in stories:
            db.add(
                Story(
                    user_id=users[username].id,
                    content=content,
                    gradient=grad,
                    created_at=created,
                )
            )
        db.commit()


def get_db():
    with Session(engine) as session:
        yield session


def get_current_user(
    session_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    if not session_token or session_token not in SESSIONS:
        return None
    username = SESSIONS[session_token]
    return db.exec(select(User).where(User.username == username)).first()


def require_user(user: User | None = Depends(get_current_user)) -> User:
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def pick_color() -> str:
    return AVATAR_COLORS[len(SESSIONS) % len(AVATAR_COLORS)]


def notify(db: Session, user_id: int, actor_id: int | None, type: str, message: str):
    db.add(Notification(user_id=user_id, actor_id=actor_id, type=type, message=message))


app = FastAPI()


@app.on_event("startup")
def on_startup():
    try:
        seed_demo_data()
    except Exception:
        pass
    try:
        backfill_profiles()
    except Exception:
        pass


def backfill_profiles():
    updates = {
        "masud": {
            "first_name": "Masud",
            "last_name": "Rahman",
            "email": "masud@starconnect.app",
            "phone": "+880 1711-000001",
            "profession": "Founder & CEO",
            "address": "Gulshan, Dhaka",
            "country": "Bangladesh",
            "website": "starconnect.app",
        },
        "nusrat": {
            "first_name": "Nusrat",
            "last_name": "Jahan",
            "email": "nusrat@marketing.io",
            "phone": "+880 1711-000002",
            "profession": "Digital Marketing Expert",
            "address": "Dhaka",
            "country": "Bangladesh",
            "website": "nusrat.digital",
        },
        "tanvir": {
            "first_name": "Tanvir",
            "last_name": "Ahmed",
            "email": "tanvir@dev.io",
            "phone": "+880 1711-000003",
            "profession": "Full-stack Developer",
            "address": "Sylhet",
            "country": "Bangladesh",
            "website": "tanvir.dev",
        },
        "sadia": {
            "first_name": "Sadia",
            "last_name": "Islam",
            "email": "sadia@career.com",
            "phone": "+880 1711-000004",
            "profession": "Career Advisor & Mentor",
            "address": "Rajshahi",
            "country": "Bangladesh",
            "website": "sadia.career",
        },
    }
    with Session(engine) as db:
        for username, fields in updates.items():
            u = db.exec(select(User).where(User.username == username)).first()
            if not u:
                continue
            changed = False
            for key, value in fields.items():
                if not getattr(u, key, ""):
                    setattr(u, key, value)
                    changed = True
            if changed:
                full = f"{u.first_name} {u.last_name}".strip()
                if full:
                    u.name = full
                db.add(u)
        db.commit()


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    res = TEMPLATES.TemplateResponse(request, "index.html", {})
    res.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    res.headers["Pragma"] = "no-cache"
    res.headers["Expires"] = "0"
    return res


def public_user(u: User) -> dict:
    return {
        "id": u.id,
        "username": u.username,
        "name": u.name or u.username,
        "first_name": u.first_name or "",
        "last_name": u.last_name or "",
        "profession": u.profession or "",
        "website": u.website or "",
        "bio": u.bio,
        "avatar_color": u.avatar_color,
        "avatar_url": u.avatar_url or None,
        "verified": u.verified,
    }


def post_dict(
    p: Post,
    author: User,
    liked: bool,
    like_count: int,
    comments: list,
    reaction: str = "",
    bookmarked: bool = False,
    shared: dict | None = None,
) -> dict:
    return {
        "id": p.id,
        "content": p.content,
        "gradient": p.gradient,
        "image": p.image or None,
        "time": p.created_at.strftime("%Y-%m-%d %H:%M"),
        "author": public_user(author),
        "liked": liked,
        "reaction": reaction,
        "like_count": like_count,
        "bookmarked": bookmarked,
        "shared": shared,
        "comments": comments,
    }


# ---------- Auth ----------


@app.post("/api/auth/signup")
async def signup(body: dict = Body(...), db: Session = Depends(get_db)):
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    first_name = (body.get("first_name") or "").strip()
    last_name = (body.get("last_name") or "").strip()
    email = (body.get("email") or "").strip()
    profession = (body.get("profession") or "").strip()
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    if db.exec(select(User).where(User.username == username)).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(
        username=username,
        password_hash=password_hash.hash(password),
        first_name=first_name,
        last_name=last_name,
        name=f"{first_name} {last_name}".strip() or username,
        email=email,
        profession=profession,
        avatar_color=pick_color(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = str(uuid4())
    SESSIONS[token] = username
    return {"token": token, "user": public_user(user)}


@app.post("/api/auth/login")
async def login(body: dict = Body(...), db: Session = Depends(get_db)):
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    user = db.exec(select(User).where(User.username == username)).first()
    if not user or not password_hash.verify(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    user.online = True
    db.add(user)
    db.commit()
    token = str(uuid4())
    SESSIONS[token] = user.username
    return {"token": token, "user": public_user(user)}


@app.post("/api/auth/logout")
async def logout(
    session_token: str | None = Cookie(default=None), db: Session = Depends(get_db)
):
    if session_token:
        username = SESSIONS.pop(session_token, None)
        if username:
            user = db.exec(select(User).where(User.username == username)).first()
            if user:
                user.online = False
                db.add(user)
                db.commit()
    return {"ok": True}


@app.get("/api/me")
async def me(
    user: User | None = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not user:
        return {"user": None}
    followers = len(db.exec(select(Follow).where(Follow.following_id == user.id)).all())
    following = len(db.exec(select(Follow).where(Follow.follower_id == user.id)).all())
    posts = len(db.exec(select(Post).where(Post.user_id == user.id)).all())
    unread = len(
        db.exec(
            select(Notification).where(
                Notification.user_id == user.id, ~Notification.read
            )
        ).all()
    )
    return {
        "user": public_user(user),
        "first_name": user.first_name or "",
        "last_name": user.last_name or "",
        "email": user.email or "",
        "phone": user.phone or "",
        "profession": user.profession or "",
        "address": user.address or "",
        "country": user.country or "",
        "website": user.website or "",
        "since": user.created_at.strftime("%B %Y"),
        "avatar_url": user.avatar_url or None,
        "followers": followers,
        "following": following,
        "posts": posts,
        "unread": unread,
    }


# ---------- Posts ----------


def build_comments(db: Session, post_id: int) -> list:
    comments = db.exec(
        select(Comment)
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
    ).all()
    result = []
    for c in comments:
        c_author = db.get(User, c.user_id)
        result.append(
            {
                "id": c.id,
                "content": c.content,
                "time": c.created_at.strftime("%Y-%m-%d %H:%M"),
                "author": public_user(c_author),
            }
        )
    return result


def build_post(db: Session, p: Post, user: User | None) -> dict:
    author = db.get(User, p.user_id)
    my_like = (
        db.exec(
            select(Like).where(Like.post_id == p.id, Like.user_id == user.id)
        ).first()
        if user
        else None
    )
    likes = db.exec(select(Like).where(Like.post_id == p.id)).all()
    bookmarked = bool(
        user
        and db.exec(
            select(Bookmark).where(
                Bookmark.post_id == p.id, Bookmark.user_id == user.id
            )
        ).first()
    )
    comment_list = build_comments(db, p.id)
    shared = None
    if p.parent_id:
        parent = db.get(Post, p.parent_id)
        if parent:
            shared = {
                "id": parent.id,
                "content": parent.content,
                "gradient": parent.gradient,
                "image": parent.image or None,
                "time": parent.created_at.strftime("%Y-%m-%d %H:%M"),
                "author": public_user(db.get(User, parent.user_id)),
            }
    return post_dict(
        p,
        author,
        liked=bool(my_like),
        like_count=len(likes),
        comments=comment_list,
        reaction=my_like.reaction if my_like else "",
        bookmarked=bookmarked,
        shared=shared,
    )


@app.get("/api/feed")
async def get_feed(
    user: User | None = Depends(get_current_user), db: Session = Depends(get_db)
):
    posts = db.exec(select(Post).order_by(Post.id.desc())).all()
    return {
        "user": public_user(user) if user else None,
        "posts": [build_post(db, p, user) for p in posts],
    }


@app.get("/api/search")
async def search(
    q: str = "",
    user: User | None = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = q.strip().lower()
    results = []
    if q:
        users = db.exec(
            select(User).where(User.username.contains(q) | User.name.contains(q))
        ).all()
        posts = db.exec(select(Post)).all()
        matched = [p for p in posts if q in p.content.lower()]
        results = [{"type": "user", **public_user(u)} for u in users] + [
            {"type": "post", **build_post(db, p, user)} for p in matched
        ]
    return {"results": results, "q": q}


@app.get("/api/trending")
async def trending(
    user: User | None = Depends(get_current_user), db: Session = Depends(get_db)
):
    topics = [
        {"tag": "#StarConnect", "posts": "12.5k posts"},
        {"tag": "#FastAPI", "posts": "8.2k posts"},
        {"tag": "#CareerTips", "posts": "5.1k posts"},
        {"tag": "#BengaliTech", "posts": "3.4k posts"},
        {"tag": "#Marketing", "posts": "2.9k posts"},
    ]
    return {"topics": topics}


@app.get("/api/stories")
async def get_stories(
    user: User | None = Depends(get_current_user), db: Session = Depends(get_db)
):
    cutoff = datetime.now() - timedelta(minutes=5)
    expired = db.exec(select(Story).where(Story.created_at < cutoff)).all()
    expired_ids = [s.id for s in expired]
    for s in expired:
        db.delete(s)
    if expired_ids:
        for v in db.exec(
            select(StoryView).where(StoryView.story_id.in_(expired_ids))
        ).all():
            db.delete(v)
    db.commit()
    stories = db.exec(
        select(Story)
        .where(Story.created_at >= cutoff)
        .order_by(Story.created_at.desc())
    ).all()
    counts = dict(
        db.exec(
            select(StoryView.story_id, func.count(StoryView.id))
            .join(Story, Story.id == StoryView.story_id)
            .where(StoryView.user_id != Story.user_id)
            .group_by(StoryView.story_id)
        ).all()
    )
    my_viewed_ids = (
        set(
            db.exec(
                select(StoryView.story_id).where(StoryView.user_id == user.id)
            ).all()
        )
        if user
        else set()
    )
    return {
        "stories": [
            {
                "id": s.id,
                "content": s.content,
                "gradient": s.gradient,
                "time": s.created_at.strftime("%H:%M"),
                "ts": s.created_at.timestamp(),
                "viewed": s.id in my_viewed_ids,
                "view_count": counts.get(s.id, 0),
                "mine": bool(user and s.user_id == user.id),
                "author": public_user(db.get(User, s.user_id)),
            }
            for s in stories
        ]
    }


@app.post("/api/stories/{story_id}/view")
async def view_story(
    story_id: int,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
) -> dict:
    story = db.get(Story, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    cutoff = datetime.now() - timedelta(minutes=5)
    if not story.created_at or story.created_at < cutoff:
        raise HTTPException(status_code=404, detail="Story expired")
    existing = db.exec(
        select(StoryView).where(
            StoryView.story_id == story_id, StoryView.user_id == user.id
        )
    ).first()
    if not existing:
        db.add(StoryView(story_id=story_id, user_id=user.id))
    db.commit()
    count = len(
        db.exec(
            select(StoryView).where(
                StoryView.story_id == story_id, StoryView.user_id != story.user_id
            )
        ).all()
    )
    return {"ok": True, "view_count": count, "viewed": True}


@app.post("/api/posts")
async def create_post(
    body: dict = Body(...),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    content = (body.get("content") or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Post content required")
    gradient = body.get("gradient") or ""
    image = (body.get("image") or "").strip() or None
    post = Post(
        user_id=user.id,
        content=content,
        gradient=gradient if gradient else "linear-gradient(135deg,#6200EE,#D397FA)",
        image=image,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return build_post(db, post, user)


@app.put("/api/posts/{post_id}")
async def edit_post(
    post_id: int,
    body: dict = Body(...),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own posts")
    content = (body.get("content") or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Post content required")
    gradient = body.get("gradient") or ""
    post.content = content
    post.gradient = gradient or post.gradient
    db.add(post)
    db.commit()
    db.refresh(post)
    return build_post(db, post, user)


@app.delete("/api/posts/{post_id}")
async def delete_post(
    post_id: int,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != user.id:
        raise HTTPException(
            status_code=403, detail="You can only delete your own posts"
        )
    for like in db.exec(select(Like).where(Like.post_id == post_id)).all():
        db.delete(like)
    for comment in db.exec(select(Comment).where(Comment.post_id == post_id)).all():
        db.delete(comment)
    for bookmark in db.exec(select(Bookmark).where(Bookmark.post_id == post_id)).all():
        db.delete(bookmark)
    for share in db.exec(select(Post).where(Post.parent_id == post_id)).all():
        db.delete(share)
    db.delete(post)
    db.commit()
    return {"ok": True}


@app.post("/api/posts/{post_id}/like")
async def toggle_like(
    post_id: int,
    body: dict = Body(default={}),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    reaction = (body.get("reaction") or "like") if body else "like"
    existing = db.exec(
        select(Like).where(Like.post_id == post_id, Like.user_id == user.id)
    ).first()
    liked = True
    if existing:
        if existing.reaction == reaction:
            db.delete(existing)
            liked = False
        else:
            existing.reaction = reaction
            db.add(existing)
    else:
        db.add(Like(post_id=post_id, user_id=user.id, reaction=reaction))
        author = db.get(User, post.user_id)
        if author and author.id != user.id:
            notify(
                db,
                author.id,
                user.id,
                "like",
                f"{user.name or user.username} reacted {reaction} to your post",
            )
    db.commit()
    count = len(db.exec(select(Like).where(Like.post_id == post_id)).all())
    return {"liked": liked, "like_count": count, "reaction": reaction}


@app.post("/api/posts/{post_id}/share")
async def share_post(
    post_id: int,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    original = db.get(Post, post_id)
    if not original:
        raise HTTPException(status_code=404, detail="Post not found")
    root_id = original.parent_id or original.id
    share = Post(
        user_id=user.id,
        parent_id=root_id,
        content="",
        gradient=original.gradient,
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    return build_post(db, share, user)


@app.post("/api/posts/{post_id}/bookmark")
async def toggle_bookmark(
    post_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    existing = db.exec(
        select(Bookmark).where(Bookmark.post_id == post_id, Bookmark.user_id == user.id)
    ).first()
    saved = True
    if existing:
        db.delete(existing)
        saved = False
    else:
        db.add(Bookmark(post_id=post_id, user_id=user.id))
    db.commit()
    return {"bookmarked": saved}


@app.post("/api/stories")
async def create_story(
    body: dict = Body(...),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    content = (body.get("content") or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Story content required")
    gradient = body.get("gradient") or "linear-gradient(135deg,#6200EE,#D397FA)"
    story = Story(user_id=user.id, content=content, gradient=gradient)
    db.add(story)
    db.commit()
    db.refresh(story)
    return {"ok": True, "id": story.id}


@app.put("/api/comments/{comment_id}")
async def edit_comment(
    comment_id: int,
    body: dict = Body(...),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    comment = db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != user.id:
        raise HTTPException(
            status_code=403, detail="You can only edit your own comments"
        )
    content = (body.get("content") or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Comment required")
    comment.content = content
    db.add(comment)
    db.commit()
    db.refresh(comment)
    author = db.get(User, comment.user_id)
    return {
        "id": comment.id,
        "content": comment.content,
        "time": comment.created_at.strftime("%Y-%m-%d %H:%M"),
        "author": public_user(author),
    }


@app.delete("/api/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    comment = db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != user.id:
        raise HTTPException(
            status_code=403, detail="You can only delete your own comments"
        )
    db.delete(comment)
    db.commit()
    return {"ok": True}


@app.post("/api/posts/{post_id}/comments")
async def add_comment(
    post_id: int,
    body: dict = Body(...),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    content = (body.get("content") or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Comment required")
    comment = Comment(post_id=post_id, user_id=user.id, content=content)
    db.add(comment)
    author = db.get(User, post.user_id)
    if author and author.id != user.id:
        notify(
            db,
            author.id,
            user.id,
            "comment",
            f"{user.name or user.username} commented on your post",
        )
    db.commit()
    db.refresh(comment)
    return {
        "id": comment.id,
        "content": comment.content,
        "time": comment.created_at.strftime("%Y-%m-%d %H:%M"),
        "author": public_user(user),
    }


# ---------- Follows ----------


@app.get("/api/users")
async def list_users(user: User = Depends(require_user), db: Session = Depends(get_db)):
    users = db.exec(select(User).where(User.id != user.id)).all()
    following_ids = {
        f.following_id
        for f in db.exec(select(Follow).where(Follow.follower_id == user.id)).all()
    }
    result = []
    for u in users:
        data = public_user(u)
        data["following"] = u.id in following_ids
        data["post_count"] = len(
            db.exec(select(Post).where(Post.user_id == u.id)).all()
        )
        result.append(data)
    return {"users": result}


@app.post("/api/users/{user_id}/follow")
async def toggle_follow(
    user_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)
):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    existing = db.exec(
        select(Follow).where(
            Follow.follower_id == user.id, Follow.following_id == user_id
        )
    ).first()
    following = True
    if existing:
        db.delete(existing)
        following = False
    else:
        db.add(Follow(follower_id=user.id, following_id=user_id))
        notify(
            db,
            user_id,
            user.id,
            "follow",
            f"{user.name or user.username} started following you",
        )
    db.commit()
    return {"following": following}


@app.get("/api/connections")
async def connections(
    user: User = Depends(require_user), db: Session = Depends(get_db)
):
    following_ids = [
        f.following_id
        for f in db.exec(select(Follow).where(Follow.follower_id == user.id)).all()
    ]
    people = []
    for uid in following_ids:
        u = db.get(User, uid)
        if u:
            people.append(public_user(u))
    return {"users": people}


@app.get("/api/bookmarks")
async def bookmarks(user: User = Depends(require_user), db: Session = Depends(get_db)):
    marks = db.exec(
        select(Bookmark)
        .where(Bookmark.user_id == user.id)
        .order_by(Bookmark.created_at.desc())
    ).all()
    posts = []
    for m in marks:
        post = db.get(Post, m.post_id)
        if post:
            posts.append(build_post(db, post, user))
    return {"posts": posts}


# ---------- Notifications ----------


@app.get("/api/notifications")
async def get_notifications(
    user: User = Depends(require_user), db: Session = Depends(get_db)
):
    notifs = db.exec(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
    ).all()
    result = []
    for n in notifs:
        actor = db.get(User, n.actor_id) if n.actor_id else None
        result.append(
            {
                "id": n.id,
                "type": n.type,
                "message": n.message,
                "read": n.read,
                "time": n.created_at.strftime("%Y-%m-%d %H:%M"),
                "actor": public_user(actor) if actor else None,
            }
        )
    return {"notifications": result}


@app.post("/api/notifications/read")
async def mark_read(user: User = Depends(require_user), db: Session = Depends(get_db)):
    notifs = db.exec(
        select(Notification).where(Notification.user_id == user.id, ~Notification.read)
    ).all()
    for n in notifs:
        n.read = True
    db.commit()
    return {"ok": True}


# ---------- Messages ----------


@app.get("/api/messages/threads")
async def get_threads(
    user: User = Depends(require_user), db: Session = Depends(get_db)
):
    all_messages = db.exec(
        select(Message).where(
            (Message.sender_id == user.id) | (Message.receiver_id == user.id)
        )
    ).all()
    other_ids: set[int] = set()
    for m in all_messages:
        other_ids.add(m.receiver_id if m.sender_id == user.id else m.sender_id)
    threads = []
    for oid in other_ids:
        other = db.get(User, oid)
        if not other:
            continue
        mine = [
            m
            for m in all_messages
            if (m.sender_id == user.id and m.receiver_id == oid)
            or (m.sender_id == oid and m.receiver_id == user.id)
        ]
        mine.sort(key=lambda m: m.created_at)
        last = mine[-1]
        threads.append(
            {
                "other": public_user(other),
                "other_online": other.online,
                "last": last.content,
                "last_time": last.created_at.strftime("%Y-%m-%d %H:%M"),
                "last_ts": last.created_at.timestamp(),
                "unread": sum(1 for m in mine if m.sender_id == oid and not m.read),
            }
        )
    threads.sort(key=lambda t: t.get("last_ts") or 0, reverse=True)
    return {"threads": threads}


@app.get("/api/messages/{user_id}")
async def get_messages(
    user_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)
):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    msgs = db.exec(
        select(Message)
        .where(
            ((Message.sender_id == user.id) & (Message.receiver_id == user_id))
            | ((Message.sender_id == user_id) & (Message.receiver_id == user.id))
        )
        .order_by(Message.created_at.asc())
    ).all()
    return {
        "other": public_user(target),
        "messages": [
            {
                "id": m.id,
                "me": m.sender_id == user.id,
                "content": m.content,
                "time": m.created_at.strftime("%H:%M"),
            }
            for m in msgs
        ],
    }


@app.post("/api/messages/{user_id}")
async def send_message(
    user_id: int,
    body: dict = Body(...),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    content = (body.get("content") or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message required")
    if len(content) > 2000:
        raise HTTPException(status_code=400, detail="Message too long")
    m = Message(sender_id=user.id, receiver_id=user_id, content=content)
    db.add(m)
    db.commit()
    db.refresh(m)
    return {
        "ok": True,
        "message": {
            "id": m.id,
            "me": True,
            "content": m.content,
            "time": m.created_at.strftime("%H:%M"),
        },
    }


@app.post("/api/messages/{user_id}/read")
async def mark_messages_read(
    user_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)
):
    msgs = db.exec(
        select(Message).where(
            Message.sender_id == user_id,
            Message.receiver_id == user.id,
            ~Message.read,
        )
    ).all()
    for m in msgs:
        m.read = True
    db.commit()
    return {"ok": True}


# ---------- Profile ----------


@app.get("/api/users/{user_id}/posts")
async def user_posts(
    user_id: int,
    user: User | None = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    posts = db.exec(
        select(Post).where(Post.user_id == user_id).order_by(Post.id.desc())
    ).all()
    return {
        "user": public_user(target),
        "posts": [build_post(db, p, user) for p in posts],
    }


@app.post("/api/profile/avatar")
async def update_avatar(
    body: dict = Body(...),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    avatar_url = (body.get("avatar_url") or "").strip()
    if not avatar_url:
        raise HTTPException(status_code=400, detail="Image required")
    if len(avatar_url) > 20_000_000:
        raise HTTPException(status_code=400, detail="Image is too large")
    if not (
        avatar_url.startswith("data:image/")
        or avatar_url.startswith(("http://", "https://"))
    ):
        raise HTTPException(status_code=400, detail="Invalid image")
    user.avatar_url = avatar_url
    db.add(user)
    post = Post(
        user_id=user.id,
        content="🖼️ Updated my profile picture",
        gradient="linear-gradient(135deg,#6200EE,#D397FA)",
        image=avatar_url,
    )
    db.add(post)
    db.commit()
    db.refresh(user)
    return {"ok": True, "avatar_url": user.avatar_url}


@app.post("/api/profile")
async def update_profile(
    body: dict = Body(...),
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    if "first_name" in body:
        user.first_name = (body.get("first_name") or "").strip()
    if "last_name" in body:
        user.last_name = (body.get("last_name") or "").strip()
    if "email" in body:
        user.email = (body.get("email") or "").strip()
    if "phone" in body:
        user.phone = (body.get("phone") or "").strip()
    if "profession" in body:
        user.profession = (body.get("profession") or "").strip()
    if "address" in body:
        user.address = (body.get("address") or "").strip()
    if "country" in body:
        user.country = (body.get("country") or "").strip()
    if "website" in body:
        user.website = (body.get("website") or "").strip()
    if "name" in body:
        user.name = (body.get("name") or "").strip()
    if "bio" in body:
        user.bio = (body.get("bio") or "").strip()
    full = f"{user.first_name} {user.last_name}".strip()
    if full:
        user.name = full
    elif not user.name:
        user.name = user.username
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user": public_user(user)}
