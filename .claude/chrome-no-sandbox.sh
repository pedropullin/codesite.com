#!/bin/sh
# Cloud sessions run as root, where Chromium refuses to start without --no-sandbox.
# The motionmaxxing render scripts launch whatever CHROME_PATH names (see .claude/settings.json).
exec /opt/pw-browsers/chromium --no-sandbox "$@"
