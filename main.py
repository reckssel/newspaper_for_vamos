"""
Vamos Newspaper – Article Tool
================================
Small desktop program for adding new articles.

What it does:
1. You fill in the form (category, image, title/text in EN/ES).
2. Clicking "Publish" adds the article to news.json.
3. The tool automatically commits the change and pushes it to 'main'.
4. GitHub Pages then rebuilds the site automatically – the article
   becomes visible to ALL visitors (not just locally like the old
   browser admin panel).

Requirements:
- Python 3 with Tkinter (included with most Python installations)
- Git is installed and 'git push' already works for you without a
  password prompt (SSH key or saved token)
- This script is located in the same folder as your 'news.json'
  (i.e. the root folder of your cloned repo) – or you can choose the
  folder manually the first time you run it.
"""

import json
import os
import re
import subprocess
import sys
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
from datetime import datetime
from pathlib import Path

CONFIG_FILE = Path(__file__).parent / ".vamos_admin_config.json"
BRANCH = "main"


# ---------- Manage repo path ----------

def load_repo_path():
    """Loads the last used repo path, or assumes the script's own folder."""
    if CONFIG_FILE.exists():
        try:
            data = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
            path = Path(data.get("repo_path", ""))
            if path.exists() and (path / "news.json").exists():
                return path
        except Exception:
            pass

    # Fallback: the script is presumably inside the repo itself
    default = Path(__file__).parent
    if (default / "news.json").exists():
        return default

    return None


def save_repo_path(path):
    CONFIG_FILE.write_text(json.dumps({"repo_path": str(path)}), encoding="utf-8")


# ---------- Git commands ----------

def run_git(repo_path, args):
    """Runs a git command and returns (success, output)."""
    result = subprocess.run(
        ["git"] + args,
        cwd=str(repo_path),
        capture_output=True,
        text=True
    )
    output = (result.stdout or "") + (result.stderr or "")
    return result.returncode == 0, output.strip()


def publish_article(repo_path, article, log_callback):
    news_path = repo_path / "news.json"

    # 1. Load news.json
    log_callback("Loading news.json ...")
    try:
        articles = json.loads(news_path.read_text(encoding="utf-8"))
    except Exception as e:
        raise RuntimeError(f"news.json could not be read: {e}")

    # 2. Generate a new, unique id (a1, a2, a3, ... sequential)
    existing_numbers = []
    for a in articles:
        match = re.match(r"^a(\d+)$", str(a.get("id", "")))
        if match:
            existing_numbers.append(int(match.group(1)))
    next_number = max(existing_numbers, default=0) + 1
    article["id"] = f"a{next_number}"

    # 3. Append and save the article
    articles.append(article)
    news_path.write_text(
        json.dumps(articles, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )
    log_callback(f"Article with id '{article['id']}' added to news.json.")

    # 4. Git: add
    ok, out = run_git(repo_path, ["add", "news.json"])
    log_callback(out or "(no output)")
    if not ok:
        raise RuntimeError("git add failed.")

    # 5. Git: commit
    title_en = article["title"].get("en", "New article")
    commit_message = f"Add article: {title_en}"
    ok, out = run_git(repo_path, ["commit", "-m", commit_message])
    log_callback(out or "(no output)")
    if not ok:
        if "nothing to commit" in out.lower():
            raise RuntimeError("Nothing to commit – was news.json actually changed?")
        raise RuntimeError("git commit failed.")

    # 6. Git: push
    log_callback(f"Pushing to '{BRANCH}' ...")
    ok, out = run_git(repo_path, ["push", "origin", BRANCH])
    log_callback(out or "(no output)")
    if not ok:
        raise RuntimeError(
            "git push failed. Check your internet connection "
            "and whether your SSH key/token is still valid."
        )

    log_callback("✅ Done! GitHub Pages is now rebuilding the site (usually takes 1-2 minutes).")


# ---------- GUI ----------

class ArticleApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Vamos Newspaper – Publish Article")
        self.geometry("640x780")

        self.repo_path = load_repo_path()

        self._build_ui()

        if self.repo_path is None:
            self.after(200, self.choose_repo_folder)

    # ---- Build UI ----

    def _build_ui(self):
        outer = ttk.Frame(self, padding=14)
        outer.pack(fill="both", expand=True)

        # Repo path display + change button
        repo_row = ttk.Frame(outer)
        repo_row.pack(fill="x", pady=(0, 10))
        self.repo_label = ttk.Label(repo_row, text=self._repo_label_text(), foreground="#555")
        self.repo_label.pack(side="left")
        ttk.Button(repo_row, text="Change repo folder", command=self.choose_repo_folder).pack(side="right")

        canvas_frame = ttk.Frame(outer)
        canvas_frame.pack(fill="both", expand=True)

        canvas = tk.Canvas(canvas_frame, highlightthickness=0)
        scrollbar = ttk.Scrollbar(canvas_frame, orient="vertical", command=canvas.yview)
        scroll_frame = ttk.Frame(canvas)

        scroll_frame.bind(
            "<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        canvas.create_window((0, 0), window=scroll_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        form = scroll_frame

        # Category
        ttk.Label(form, text="Category", font=("", 10, "bold")).pack(anchor="w", pady=(4, 2))
        self.category_var = tk.StringVar(value="argentina")
        cat_row = ttk.Frame(form)
        cat_row.pack(anchor="w", pady=(0, 10))
        ttk.Radiobutton(cat_row, text="Argentina", variable=self.category_var, value="argentina").pack(side="left")
        ttk.Radiobutton(cat_row, text="Spain", variable=self.category_var, value="spain").pack(side="left", padx=(15, 0))

        # Image
        ttk.Label(form, text="Image path (e.g. images/my-image.jpg)", font=("", 10, "bold")).pack(anchor="w", pady=(4, 2))
        self.image_entry = ttk.Entry(form, width=70)
        self.image_entry.pack(fill="x", pady=(0, 10))

        # Title
        self.title_en = self._add_labeled_entry(form, "Title (English)")
        self.title_es = self._add_labeled_entry(form, "Title (Spanish)")

        # Summary
        self.summary_en = self._add_labeled_textarea(form, "Summary (English)")
        self.summary_es = self._add_labeled_textarea(form, "Summary (Spanish)")

        # Full text
        self.content_en = self._add_labeled_textarea(form, "Full text (English)", height=5)
        self.content_es = self._add_labeled_textarea(form, "Full text (Spanish)", height=5)

        # Publish button
        self.publish_btn = ttk.Button(form, text="🚀 Publish (commit + push)", command=self.on_publish)
        self.publish_btn.pack(fill="x", pady=(14, 10), ipady=8)

        # Log output
        ttk.Label(form, text="Log:", font=("", 9, "bold")).pack(anchor="w")
        self.log_box = scrolledtext.ScrolledText(form, height=8, state="disabled", font=("Courier", 9))
        self.log_box.pack(fill="x", pady=(2, 10))

    def _add_labeled_entry(self, parent, label):
        ttk.Label(parent, text=label, font=("", 10, "bold")).pack(anchor="w", pady=(4, 2))
        entry = ttk.Entry(parent, width=70)
        entry.pack(fill="x", pady=(0, 8))
        return entry

    def _add_labeled_textarea(self, parent, label, height=3):
        ttk.Label(parent, text=label, font=("", 10, "bold")).pack(anchor="w", pady=(4, 2))
        text = tk.Text(parent, height=height, wrap="word", font=("", 10))
        text.pack(fill="x", pady=(0, 8))
        return text

    def _repo_label_text(self):
        if self.repo_path:
            return f"Repo folder: {self.repo_path}"
        return "Repo folder: (not chosen yet)"

    # ---- Actions ----

    def choose_repo_folder(self):
        folder = filedialog.askdirectory(title="Choose the folder of your cloned repo")
        if not folder:
            if self.repo_path is None:
                messagebox.showwarning(
                    "No folder chosen",
                    "Without a repo folder the tool cannot publish. "
                    "Click 'Change repo folder' whenever you're ready."
                )
            return

        path = Path(folder)
        if not (path / "news.json").exists():
            messagebox.showerror(
                "news.json not found",
                f"No news.json was found in '{folder}'. "
                "Please choose the root folder of your repo (where news.json is located)."
            )
            return

        self.repo_path = path
        save_repo_path(path)
        self.repo_label.config(text=self._repo_label_text())

    def log(self, message):
        self.log_box.configure(state="normal")
        self.log_box.insert("end", message + "\n")
        self.log_box.see("end")
        self.log_box.configure(state="disabled")
        self.update_idletasks()

    def on_publish(self):
        if self.repo_path is None:
            messagebox.showerror("No repo folder", "Please choose your repo folder first.")
            return

        title_en = self.title_en.get().strip()
        title_es = self.title_es.get().strip()

        if not (title_en and title_es):
            messagebox.showwarning("Missing information", "Please fill in the title in both languages.")
            return

        article = {
            "category": self.category_var.get(),
            "title": {
                "en": title_en,
                "es": title_es,
            },
            "summary": {
                "en": self.summary_en.get("1.0", "end").strip(),
                "es": self.summary_es.get("1.0", "end").strip(),
            },
            "content": {
                "en": self.content_en.get("1.0", "end").strip(),
                "es": self.content_es.get("1.0", "end").strip(),
            },
            "image": self.image_entry.get().strip(),
            "date": datetime.now().isoformat(timespec="seconds"),
        }

        confirm = messagebox.askyesno(
            "Confirm publish",
            f"Article '{title_en}' will be added to news.json,\n"
            f"committed and pushed to '{BRANCH}'.\n\nContinue?"
        )
        if not confirm:
            return

        self.publish_btn.config(state="disabled")
        self.log("— Starting publish —")

        try:
            publish_article(self.repo_path, article, self.log)
            messagebox.showinfo("Success", "Article was published and pushed! 🎉")
            self._clear_form()
        except Exception as e:
            self.log(f"❌ Error: {e}")
            messagebox.showerror("Error", str(e))
        finally:
            self.publish_btn.config(state="normal")

    def _clear_form(self):
        self.image_entry.delete(0, "end")
        for entry in (self.title_en, self.title_es):
            entry.delete(0, "end")
        for text in (self.summary_en, self.summary_es,
                     self.content_en, self.content_es):
            text.delete("1.0", "end")


if __name__ == "__main__":
    try:
        app = ArticleApp()
        app.mainloop()
    except tk.TclError as e:
        print("Tkinter could not be started:", e)
        print("On Linux, you may need to install: sudo apt install python3-tk")
        sys.exit(1)