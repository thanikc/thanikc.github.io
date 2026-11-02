# Tooling

- **Missing tools**: don't improvise workarounds or trial-and-error scripts; stop and tell the user what to install.
- **Images**: ImageMagick `convert` only. Exception: `convert` drops SVG gradients (renders black), so decode gradient SVGs with `rsvg-convert -w SIZE -h SIZE --background-color=none in.svg -o out.png`, then continue with `convert`. Anything else that doesn't fit: stop and flag it.
- **Tokens**: single-pass diagnostic scripts; never read binary/image assets into context when metrics suffice.
