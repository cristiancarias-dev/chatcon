#!/bin/bash
set -e

case "${1:-}" in
  backend)
    docker compose up --build -d db backend
    docker compose logs -f backend
    ;;
  frontend)
    docker compose up --build -d frontend
    ;;
  all)
    docker compose up --build -d
    docker compose logs -f
    ;;
  test)
    docker compose run --rm backend pytest
    ;;
  down)
    docker compose down -v
    ;;
  *)
    echo "Usage: $0 {backend|frontend|all|test|down}"
    exit 1
    ;;
esac
