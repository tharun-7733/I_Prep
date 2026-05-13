import os, re

MAPPING = {
    '<i class="ph-fill ph-fire icon-fire"></i>': '<i class="ph-fill ph-fire icon-fire"></i>',
    '<i class="ph-fill ph-chart-bar icon-gradient"></i>': '<i class="ph-fill ph-chart-bar icon-gradient"></i>',
    '<i class="ph-fill ph-note-pencil icon-gradient"></i>': '<i class="ph-fill ph-note-pencil icon-gradient"></i>',
    '<i class="ph-fill ph-medal icon-gold"></i>': '<i class="ph-fill ph-medal icon-gold"></i>',
    '<i class="ph-fill ph-trophy icon-gold"></i>': '<i class="ph-fill ph-trophy icon-gold"></i>',
    '<i class="ph-fill ph-robot icon-gradient"></i>': '<i class="ph-fill ph-robot icon-gradient"></i>',
    '<i class="ph-fill ph-briefcase icon-gradient"></i>': '<i class="ph-fill ph-briefcase icon-gradient"></i>',
    '<i class="ph-fill ph-brain icon-gradient"></i>': '<i class="ph-fill ph-brain icon-gradient"></i>',
    '<i class="ph-fill ph-chats icon-gradient"></i>': '<i class="ph-fill ph-chats icon-gradient"></i>',
    '<i class="ph-fill ph-crown icon-gold"></i>': '<i class="ph-fill ph-crown icon-gold"></i>',
    '<i class="ph-fill ph-lock-key" style="color: #888"></i>': '<i class="ph-fill ph-lock-key" style="color: #888"></i>',
    '<i class="ph-fill ph-lightbulb icon-gold"></i>': '<i class="ph-fill ph-lightbulb icon-gold"></i>',
    '<i class="ph ph-eye"></i>': '<i class="ph ph-eye"></i>',
    '<i class="ph ph-eye-slash"></i>': '<i class="ph ph-eye-slash"></i>',
    '<i class="ph-fill ph-check-circle" style="color: #00ff88"></i>': '<i class="ph-fill ph-check-circle" style="color: #00ff88"></i>',
    '<i class="ph-fill ph-info" style="color: #00d4ff"></i>': '<i class="ph-fill ph-info" style="color: #00d4ff"></i>',
    '<i class="ph-fill ph-warning-circle" style="color: #ffcc00"></i>': '<i class="ph-fill ph-warning-circle" style="color: #ffcc00"></i>',
    '<i class="ph-fill ph-x-circle" style="color: #ff4d6d"></i>': '<i class="ph-fill ph-x-circle" style="color: #ff4d6d"></i>',
}

def replace_emojis(content):
    for emoji, icon in MAPPING.items():
        content = content.replace(emoji, icon)
    return content

for root, dirs, files in os.walk("."):
    if ".git" in root or "__pycache__" in root: continue
    for file in files:
        if file.endswith((".html", ".js", ".py")):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            new_content = replace_emojis(content)
            
            # Inject phosphor icons into html files
            if file.endswith(".html"):
                phosphor = '<script src="https://unpkg.com/@phosphor-icons/web"></script>'
                if phosphor not in new_content:
                    new_content = new_content.replace('</head>', f'  {phosphor}\n</head>')
            
            # For practice.js, fix innerHTML
            if file == "practice.js" and "$('badgeEmoji').textContent = cfg.emoji" in new_content:
                new_content = new_content.replace("$('badgeEmoji').textContent = cfg.emoji", "$('badgeEmoji').innerHTML = cfg.emoji")
                
            # For login.js
            if file == "login.js":
                new_content = new_content.replace("btn.textContent = inp.type==='password' ?", "btn.innerHTML = inp.type==='password' ?")
            
            if new_content != content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {path}")
