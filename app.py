"""
Point d'entrée — API gestion des RDV médicaux (Oracle + Flask).

Prérequis : sql/01_installation/01_grants.sql puis sql/01_installation/02_database.sql (voir sql/README.md), variables dans .env (voir .env.example).

Lancement API :
  pip install -r requirements.txt
  python app.py

Options utiles :
  python app.py --waitress   → serveur WSGI Waitress (pas d’avertissement « development server »)
  python app.py --no-debug   → moins de messages (pas de reloader / PIN debugger)

Variables : FLASK_HOST, FLASK_PORT, FLASK_DEBUG (voir README).

Frontend (Vite) : npm run dev dans le dossier frontend (variable VITE_API_URL).
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

from backend.app import create_app

app = create_app()


def _should_print_flask_dev_banner(use_reloader: bool) -> bool:
    """Évite le double affichage : en debug, le reloader relance main() dans un sous-processus."""
    if not use_reloader:
        return True
    return os.environ.get("WERKZEUG_RUN_MAIN") == "true"


def print_launch_banner(
    *,
    url: str,
    stack: str,
    debug: bool,
    show_waitress_tip: bool,
) -> None:
    """Bannière terminal (Rich) : lisible, couleurs si le terminal le supporte."""
    from rich import box
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table

    console = Console(force_terminal=sys.stdout.isatty())

    grid = Table.grid(padding=(0, 1))
    grid.add_column(justify="right", style="bright_cyan", no_wrap=True)
    grid.add_column()

    grid.add_row("URL", f"[bold green]{url}[/]")

    if stack == "waitress":
        stack_line = "[bold white]Waitress[/]  [dim]WSGI · 6 threads[/]"
    else:
        stack_line = "[bold white]Werkzeug[/]  [dim]Flask · dev server[/]"
        if debug:
            stack_line += "  [yellow]●[/] [dim]DEBUG + reload[/]"
    grid.add_row("Stack", stack_line)
    grid.add_row("", "[dim]Ctrl+C pour arrêter[/]")

    panel = Panel(
        grid,
        title="[bold bright_white]rdv_app[/]  [dim]│[/]  [italic bright_blue]API REST · Oracle + Flask[/]",
        subtitle="[dim]/api/health  ·  /api/auth  ·  /api/…[/]",
        border_style="bright_blue",
        box=box.ROUNDED,
        padding=(1, 2),
        width=max(
            52,
            min(76, (console.size.width or 88) - 4),
        ),
    )

    console.print()
    console.print(panel)
    if show_waitress_tip:
        console.print(
            "  [dim]Sans message WARNING Werkzeug :[/] [bold cyan]python app.py --waitress[/]\n",
        )
    else:
        console.print()


def main() -> None:
    parser = argparse.ArgumentParser(description="API gestion des RDV médicaux")
    parser.add_argument(
        "--waitress",
        action="store_true",
        help="Serveur WSGI Waitress (sortie plus sobre, sans avertissement serveur de dev Werkzeug)",
    )
    parser.add_argument(
        "--no-debug",
        action="store_true",
        help="Désactive le mode debug Flask (pas de reloader, pas de PIN debugger)",
    )
    args = parser.parse_args()

    host = os.environ.get("FLASK_HOST", "127.0.0.1")
    port = int(os.environ.get("FLASK_PORT", "5000"))
    url = f"http://{host}:{port}"

    env_debug = os.environ.get("FLASK_DEBUG", "1").strip().lower() in ("1", "true", "yes", "on")
    use_debug = env_debug and not args.no_debug

    if args.waitress:
        try:
            from waitress import serve
        except ImportError:
            try:
                from rich.console import Console

                Console(stderr=True).print(
                    "[bold red]Waitress absent.[/]  [dim]pip install waitress[/]",
                )
            except ImportError:
                print("Installez Waitress : pip install waitress", file=sys.stderr)
            sys.exit(1)
        print_launch_banner(
            url=url,
            stack="waitress",
            debug=False,
            show_waitress_tip=False,
        )
        serve(app, host=host, port=port, threads=6)
        return

    if _should_print_flask_dev_banner(use_reloader=use_debug):
        print_launch_banner(
            url=url,
            stack="werkzeug",
            debug=use_debug,
            show_waitress_tip=True,
        )
    app.run(debug=use_debug, host=host, port=port, use_reloader=use_debug)


if __name__ == "__main__":
    main()
