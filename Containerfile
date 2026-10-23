FROM docker.io/barichello/godot-ci:4.3

WORKDIR /workspace

# Install ca-certificates and curl if needed
LABEL maintainer="Mythos Studios"
LABEL description="Mythos 3D Godot Engine Containerized CI and Build Environment"

ENTRYPOINT ["godot", "--headless", "--path", "./godot"]
CMD ["-s", "res://tests/runner.gd"]
