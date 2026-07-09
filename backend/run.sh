

cd "$(dirname "$0")"


if [ -f "../.venv/bin/activate" ]; then
    source ../.venv/bin/activate
fi


if [ -f .env ]; then
    export $(cat .env | xargs)
fi


python app.py
