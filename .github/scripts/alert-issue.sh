#!/usr/bin/env bash
# Keeps a single open issue labelled `ai-ling-alert`.
#   alert-issue.sh raise "<title>" <body-file>   open it, or comment when one is already open
#   alert-issue.sh clear                         close it (with a note) if one is open
# Needs GH_TOKEN with `issues: write`; run inside a checkout of the repo.
set -euo pipefail

label=ai-ling-alert
open_issue() { gh issue list --label "$label" --state open --json number --jq '.[0].number // empty'; }

case "${1:-}" in
  raise)
    title=$2 body_file=$3
    number=$(open_issue)
    if [ -n "$number" ]; then
      gh issue comment "$number" --body-file "$body_file"
    else
      gh label create "$label" --color B60205 --description "AI Ling health alert" 2>/dev/null || true
      gh issue create --title "$title" --label "$label" --body-file "$body_file"
    fi
    ;;
  clear)
    number=$(open_issue)
    [ -z "$number" ] || gh issue close "$number" --comment "All AI Ling checks pass again."
    ;;
  *)
    echo "usage: $0 raise <title> <body-file> | clear" >&2
    exit 2
    ;;
esac
