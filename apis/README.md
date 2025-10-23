# ACP Gateway APIs
This directory houses the API gateway implementation of all public ACP specs.

Now you can pull upstream updates anytime:

git fetch upstream
git merge upstream/main


# Mountain Freedom APIs

This directory houses the unified FastAPI server that powers every custom Mountain Freedom integration. All bespoke endpoints should live inside this service so they can share authentication, configuration, and deployment tooling.

## Layout
- `app/main.py` – FastAPI application setup, CORS policy, and the uvicorn entry point.
- `app/core/` – Shared helpers such as the Supabase client factory and domain utilities.
- `app/routers/` – Component-scoped routers. Each integration owns a package, for example `app/routers/aeo_tracking/`.

## Adding a New Component
1. Create a package under `app/routers/<component_name>/` with your endpoint modules and an `__init__.py` that exposes an `APIRouter` instance as `router`.
2. Import and include the component router inside `app/routers/__init__.py` so FastAPI registers it with the application.
3. Document and wire any required configuration (environment variables, secrets, etc.) inside `app/core` or the deployment manifests instead of hard-coding values.

## Local Development
- `python -m venv ../.venv && source ../.venv/bin/activate`
- `pip install -r requirements.txt`
- Create `.env` with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `./start_server.sh` to launch Uvicorn and write logs to `logs/`
- `deactivate`

With this setup every custom API addition follows the same lifecycle and can be deployed as part of the single FastAPI service.
