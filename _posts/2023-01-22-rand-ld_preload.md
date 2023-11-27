---
layout: post
title: Hijack de rand() usando LD_PRELOAD trick
author: c4rta
date: 2023-01-22
##categories: [Explotacion binaria]
tags: [Explotacion Binaria, ld_preload]
image: /assets/img/heap2/waifu.jpg
---
En este caso vamos a hacer hijack de la funcion rand() para controlar la generacion de numeros aletorios con el fin de que sea completamente predecible.
{:.lead}

El credito es para ```ProfessionallyEvil``` ya que es el creador de este desafio: ```https://github.com/ProfessionallyEvil/LD_PRELOAD-rand-Hijack-Example.git```

## Funcionamiendo de LD_PRELOAD

### Bibliotecas compartidas

Una biblioteca es una colección de funciones compiladas. Podemos hacer uso de estas funciones en nuestros programas sin reescribir la misma funcionalidad. Esto se puede lograr usando el código de la biblioteca en nuestro programa (static library) o vinculando dinámicamente en tiempo de ejecución (shared library)

Usando bibliotecas estáticas, podemos crear programas independientes. Asi que, los programas creados con una biblioteca compartida ocupan compatibilidad con el enlazador en tiempo de ejecución. Por esto mismo, antes de ejecutar un programa, se cargan todos los símbolos requeridos y se prepara el programa para su ejecución

### Funcionamiento de LD_PRELOAD

LD_PRELOAD trick se aprovecha la funcionalidad proporcionada por el enlazador dinámico en, UNIX permiten decirle al enlazador que vincule los símbolos proporcionados por un cierta biblioteca compartida antes que otras bibliotecas, todo esto se hace en tiempo de ejecucion 

### Inyeccion de codigo usando LD_PRELOAD

Este es un ejemplo de ```Pedro Goldsborough```:

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main(int argc, const char *argv[]) {
  char buffer[1000];
  int amount_read;
  int fd;

  fd = fileno(stdin);
  if ((amount_read = read(fd, buffer, sizeof buffer)) == -1) {
    perror("error reading");
    return EXIT_FAILURE;
  }

  if (fwrite(buffer, sizeof(char), amount_read, stdout) == -1) {
    perror("error writing");
    return EXIT_FAILURE;
  }

  return EXIT_SUCCESS;
}
```

A grandes rasgos lo que hace es leer una cadena con ```stdin``` y la imprime

Pero que pasara ahora si creamos una nueva definicion para la syscall ```read``` y se la pasamos al programa original antes de la definicion que proporciona ```libc``` osea la que esta en el binario original

Para esto hay que crear la nueva definicion de ```read``` exactamente como la del binario original:

```c
#include <string.h>

size_t read(int fd, void *data, size_t size) {
  strcpy(data, "holi boli");
  return 9;
}
```

Ahora lo que haremos es compilar ese nuevo codigo en una biblioteca:

```gcc -shared -fPIC -o hijack.so hijack.c```

Ahora usaremos LD_PRELOAD para configurar la variable de entorno apropiada a LD_PRELOAD a la ruta a nuestra biblioteca compartida

```LD_PRELOAD=$PWD/hijack.so ./ejemplo```

Esto tambien hara que se ejecute el binario original pero con la nueva declaracion de ```read``` que contienen la cadena ```holi boli```, esto se logro ya que se cargo antes de que se cargara la funcion ```read``` del binario original. Verdad que es muy simple?, pues algo asi se ha usado para realizar cosas que pueden comprometer todo un sistema, y comunmente usado para escalar privilegios.

## Resolucion del ejercicio

Cuando ejecutamos el binario lo que nos pone es que ingresemos un numero entre 0 y 31337, el cual si es igual al numero generado con por rand() entonces nos dice que ganamos

```
./guessing_game                                                                                                                                      ─╯

	---===[ Number Guessing Game v1.0 ]===---

 [?] Guess a number between 0-31337 > 2
 [-] You lose. :-(
```

Evidentemente adivinar un numero entre esas cifras es casi imposible, y encima en cada ejecucion se crear un nuevo numero random, para eso usaremos LD_PRELOAD, y el creador del desafio nos provee un archivo para hacer hijack de rand():

```c
#include <stdio.h>

int rand(void) {
    return 42; 
}
```
Basicamente crea una funcion llamada rand y siempre regresa el 42, asi que simplemente vamos a compilar el archivo con: ```make hijack``` 

Aqui hay que destacar que se usa ```-FPIC``` para que el binario de compile como independiente de la posicion del codigo, esto para hacer que el codigo se cargue en un espacio de direcciones aleatorio, y el ```-shared``` es para que se compile como un objeto compartido (.so).

Ahora si hacemos uso de ```LD_PRELOAD``` para cargar el objeto compartido con la nueva declaracion de rand, podemos ver que si ingresamos ```42``` ahora nos dice ```You win```

```
LD_PRELOAD=./rand_hijack.so ./guessing_game                                                                                                          ─╯

	---===[ Number Guessing Game v1.0 ]===---

 [?] Guess a number between 0-31337 > 42
 [+] You Win! :-)
```

Y como vendo mencionando, esto sucede por que se crea una nueva declaracion de ```rand()``` antes de la declaracion del binario original, esto se debe a que con ```LD_PRELOAD``` podemos cargar una biblioteca antes que las del binario original. Ese es el ejemplo basico de como usar ```LD_PRELOAD``` para modificar el comportamiento de un programa

Eso ha sido todo, gracias por leer ❤
