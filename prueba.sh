docker compose exec -T  backend python - <<'PY'
from passlib.context import CryptContext
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
print(pwd.hash("ope123"))
PY
