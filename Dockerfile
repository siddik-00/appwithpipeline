FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS build

WORKDIR /app

COPY pyproject.toml uv.lock README.md LICENSE ./
RUN uv sync --no-dev --extra standard --locked --no-install-project

COPY . .
RUN uv sync --no-dev --extra standard --locked

FROM python:3.11-slim

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY --from=build /app/.venv /app/.venv
COPY --from=build /app /app

EXPOSE 8000

CMD ["uvicorn", "docs_src.first_steps.tutorial001_py310:app", "--host", "0.0.0.0", "--port", "8000"]