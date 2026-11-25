Five steps for an agent that sets Semantius up for its user. The details and
the exceptions are in the Semantius CLI's README, under "Quick Start" and
"Setting up through an AI agent":
https://raw.githubusercontent.com/semantius/semantius-cli/main/README.md

1. Install the CLI. On Linux or macOS:
   `curl -fsSL https://raw.githubusercontent.com/semantius/semantius-cli/main/install.sh | bash`
   On Windows, from any shell, Git Bash included:
   `powershell -NoProfile -Command "irm https://raw.githubusercontent.com/semantius/semantius-cli/main/install.ps1 | iex"`
   Your shell does not see the new PATH, so call the binary by the full path
   the installer prints on its `Location:` line.
2. Install the skills: `npx -y skills add semantius/semantius-cli -g --all`.
   The installer needs Node.js 22.20 or later and git. Meta's Muse has no
   global install, so on Muse use
   `npx -y skills add semantius/semantius-cli --all --subagent root`.
   On OpenClaw, use
   `npx -y skills add semantius/semantius-cli -g --agent openclaw`.
3. Ask the user for their instance address, and give them
   https://app.semantius.com in the same message: they sign up there, or sign
   in to find the address on the dashboard's Get Started card.
4. Run `semantius use <address>` as a background command and give the user the
   sign-in URL it prints. Add `--login-flow device` when the user is not at
   this machine's screen.
5. Check the connection with `semantius whoami`.
