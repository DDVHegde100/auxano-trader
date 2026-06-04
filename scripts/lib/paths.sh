# Docker Desktop on Mac is often not on PATH in non-interactive shells
export PATH="/Applications/Docker.app/Contents/Resources/bin:/usr/local/bin:/opt/homebrew/bin:${PATH}"

docker_cmd() {
  if command -v docker >/dev/null 2>&1; then
    docker "$@"
    return $?
  fi
  if [ -x /Applications/Docker.app/Contents/Resources/bin/docker ]; then
    /Applications/Docker.app/Contents/Resources/bin/docker "$@"
    return $?
  fi
  return 127
}

compose_cmd() {
  if docker_cmd compose version >/dev/null 2>&1; then
    docker_cmd compose "$@"
  elif docker_cmd docker-compose version >/dev/null 2>&1; then
    docker_cmd docker-compose "$@"
  else
    return 127
  fi
}
