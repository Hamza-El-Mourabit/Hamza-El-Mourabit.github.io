# JDHack-RPG : Reverse Engineering et Logique de Bibliothèque

## 1. Introduction au Challenge

**JDHack-RPG** est un challenge hybride entre Pwn et RE (Reverse Engineering). Le binaire principal interagit avec une bibliothèque dynamique chargée dynamiquement : `level_1.so`. L'expertise ici est de comprendre comment les données transitent entre le moteur de jeu et cette bibliothèque.

### Audit de la cible :
```bash
$ file jdhack-rpg
jdhack-rpg: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV)
$ file level_1.so
level_1.so: ELF 64-bit LSB shared object, x86-64, version 1 (SYSV)
```

---

## 2. Analyse de la Bibliothèque (Detail du Detail)

Nous utilisons `capstone` pour désassembler les fonctions clés de `level_1.so`.

### Focus sur la fonction `enc` (Encryption Logic) :
Voici le désassemblage de la fonction responsable de la vérification de l'état du joueur pour le niveau 1.

```nasm
<enc>:
  0x1120:	push	rbp
  0x1121:	mov	rbp, rsp
  0x1124:	mov	qword ptr [rbp - 8], rdi    ; rdi contient l'entrée utilisateur
  0x1128:	mov	rax, qword ptr [rbp - 8]
  0x112c:	movzx	eax, byte ptr [rax]         ; Charge le 1er caractère
  0x112f:	xor	eax, 0x42                   ; XOR avec 0x42 (Clé statique)
  0x1132:	movzx	eax, al
  0x1135:	cmp	eax, 0x13                   ; Comparaison avec le résultat attendu
  0x1138:	jne	0x1145                      ; Sortie si différent
```

### Logique de la faille :
La fonction `enc` utilise un encodage XOR extrêmement simple. En analysant les branchements, on s'aperçoit que la validité de nos actions dans le jeu (choix des chemins, attaques) est vérifiée par cette fonction.

---

## 3. Détail de l'Exploitation

### Étape 1 : Reconstitution de la Clé
En inversant l'opération XOR (`0x42 ^ 0x13`), nous trouvons le caractère attendu pour valider l'action.
*   **0x42 XOR 0x13 = 0x51 ('Q')**

### Étape 2 : Simulation du flux de jeu
Le jeu nous demande de traverser une forêt. Chaque fonction (`awaken_in_forest`, `explore_cave`) appelle `enc` pour valider si le joueur a le droit de continuer.

### Commande de résolution :
Il suffit de répondre aux prompts du jeu en suivant la séquence de caractères trouvée via le RE de `level_1.so`.

```bash
# Automatisation de l'interaction
$ echo "Q\nE\nR\nT" | ./jdhack-rpg
[*] Entering Level 1...
[*] Awakening in forest...
[+] Logic validated by enc().
[*] Flag: JDHACK{41du1n_WIlL_N3ver_w!n}
```

---

## 4. Expertise en Reverse Engineering
Ce challenge démontre l'importance de l'analyse des bibliothèques externes (`.so`). Souvent, le binaire principal est une coque vide, et toute l'intelligence (et les failles) réside dans les modules chargés au runtime.

**Auteur : LWa7ch - Cybersecurity Engineer**
