#!/usr/bin/env python3
"""Elimina comentarios de archivos JS, CSS y HTML respetando strings/regex."""
import sys


def strip_js(src):
    out = []
    i = 0
    n = len(src)
    # estados: normal, string, template, regex
    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ''

        # comentario de linea
        if c == '/' and nxt == '/':
            while i < n and src[i] != '\n':
                i += 1
            continue
        # comentario de bloque
        if c == '/' and nxt == '*':
            i += 2
            while i < n and not (src[i] == '*' and i + 1 < n and src[i + 1] == '/'):
                i += 1
            i += 2
            continue
        # strings con comillas
        if c in ('"', "'"):
            quote = c
            out.append(c)
            i += 1
            while i < n:
                out.append(src[i])
                if src[i] == '\\':
                    if i + 1 < n:
                        out.append(src[i + 1])
                        i += 2
                        continue
                if src[i] == quote:
                    i += 1
                    break
                i += 1
            continue
        # template literals
        if c == '`':
            out.append(c)
            i += 1
            while i < n:
                out.append(src[i])
                if src[i] == '\\':
                    if i + 1 < n:
                        out.append(src[i + 1])
                        i += 2
                        continue
                if src[i] == '`':
                    i += 1
                    break
                i += 1
            continue
        # regex literal: detectar si '/' puede iniciar regex
        if c == '/':
            # buscar ultimo caracter no-espacio emitido
            j = len(out) - 1
            while j >= 0 and out[j] in ' \t\n\r':
                j -= 1
            prev = out[j] if j >= 0 else ''
            if prev == '' or prev in '(,=:[!&|?{};+-*%^~<>':
                # es regex
                out.append(c)
                i += 1
                in_class = False
                while i < n:
                    out.append(src[i])
                    if src[i] == '\\':
                        if i + 1 < n:
                            out.append(src[i + 1])
                            i += 2
                            continue
                    if src[i] == '[':
                        in_class = True
                    elif src[i] == ']':
                        in_class = False
                    elif src[i] == '/' and not in_class:
                        i += 1
                        break
                    i += 1
                continue

        out.append(c)
        i += 1

    return clean_blank_lines(''.join(out))


def strip_block_only(src):
    """CSS: solo comentarios de bloque, respetando strings."""
    out = []
    i = 0
    n = len(src)
    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ''
        if c == '/' and nxt == '*':
            i += 2
            while i < n and not (src[i] == '*' and i + 1 < n and src[i + 1] == '/'):
                i += 1
            i += 2
            continue
        if c in ('"', "'"):
            quote = c
            out.append(c)
            i += 1
            while i < n:
                out.append(src[i])
                if src[i] == '\\' and i + 1 < n:
                    out.append(src[i + 1])
                    i += 2
                    continue
                if src[i] == quote:
                    i += 1
                    break
                i += 1
            continue
        out.append(c)
        i += 1
    return clean_blank_lines(''.join(out))


def strip_html(src):
    """HTML: elimina <!-- --> y comentarios dentro de <script>/<style>."""
    import re
    # Procesar bloques script/style con el stripper adecuado
    def repl_script(m):
        return m.group(1) + strip_js(m.group(2)) + m.group(3)

    def repl_style(m):
        return m.group(1) + strip_block_only(m.group(2)) + m.group(3)

    src = re.sub(r'(<script\b[^>]*>)(.*?)(</script>)', repl_script, src,
                 flags=re.DOTALL | re.IGNORECASE)
    src = re.sub(r'(<style\b[^>]*>)(.*?)(</style>)', repl_style, src,
                 flags=re.DOTALL | re.IGNORECASE)
    # comentarios HTML
    src = re.sub(r'<!--.*?-->', '', src, flags=re.DOTALL)
    return clean_blank_lines(src)


def clean_blank_lines(src):
    lines = src.split('\n')
    result = []
    for line in lines:
        # eliminar lineas que quedaron solo con espacios tras quitar comentario
        if line.strip() == '':
            result.append('')
        else:
            result.append(line.rstrip())
    # colapsar multiples lineas en blanco consecutivas en una sola
    final = []
    blank = False
    for line in result:
        if line == '':
            if not blank:
                final.append(line)
            blank = True
        else:
            final.append(line)
            blank = False
    # quitar lineas en blanco al inicio
    while final and final[0] == '':
        final.pop(0)
    text = '\n'.join(final)
    if not text.endswith('\n'):
        text += '\n'
    return text


def main():
    for path in sys.argv[1:]:
        with open(path, 'r', encoding='utf-8') as f:
            src = f.read()
        if path.endswith('.js'):
            new = strip_js(src)
        elif path.endswith('.css'):
            new = strip_block_only(src)
        elif path.endswith('.html'):
            new = strip_html(src)
        else:
            continue
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new)
        print('procesado:', path)


if __name__ == '__main__':
    main()
