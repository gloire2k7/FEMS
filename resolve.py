import re
import sys

def resolve_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to match the conflict blocks
    # <<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> [commit_hash]\n
    # We want to replace it with just group 1 (local changes)
    # Using re.DOTALL to match across newlines
    pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n=======\n.*?\n>>>>>>> [a-f0-9]+(?:\n|$)', re.DOTALL)
    
    new_content, num_subs = pattern.subn(r'\1\n', content)
    
    if num_subs > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Resolved {num_subs} conflicts in {filepath}")
    else:
        print(f"No conflicts found or regex failed in {filepath}")

if __name__ == '__main__':
    files = [
        'd:/Codes/FEMS-master/FEMS-master/front/src/app/pages/signin/signin.html',
        'd:/Codes/FEMS-master/FEMS-master/front/src/app/pages/signup/signup.html',
        'd:/Codes/FEMS-master/FEMS-master/front/src/styles.css'
    ]
    for file in files:
        resolve_file(file)
