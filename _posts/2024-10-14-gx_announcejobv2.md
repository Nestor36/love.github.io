---
layout: post
title: gx_announcejobv2 
author: GuxFiz
date: 2024-10-14
tags: [FIVEM, ESX, QB, LUA, HTML, CSS, JS]
image: /assets/img/banners/gx_announcejobv2.png
description: "Fully configurable and modifiable worker announcement system for events on your server!"
---
# INSTALLATION

- **1** U NEED DOWNLOAD SCRIPT OR **[BUY HERE](https://guxfiz.tebex.io/category/standlone)**
- **2** DRAG AND DROP IN U RESOURCES 
- **3** IN U SERVER.CFG INSERT => 
<em>server.cfg</em>
```ruby
ensure gx_lib
ensure gx_announcejobv2
```

## Configuration
Easy Configuration!! 🐧

```
options = {
    Command = "anuncio", -- /anuncio Welcome testing
    cooldown = 30, -- Cooldown seconds
    jobs = {
        ['police'] = { -- job
            profile = "https://pbs.twimg.com/media/EiIv4AZXkAE8YZ0.png", -- nil | 'url'
            title = "POLICE DEPARTMENT", -- 'text'
            timer = {
                duration = 25, -- Duration of announce in seconds
            },
            sound = {
                sound = "./music/2.wav", -- nil | ./music/1.wav | Add sound here => gx_announcejobv2\web\music\1.wav
                soundVolume = 0.2, -- recommend 0.2  | Volume min 0.1 max 0.5
            },
            style = {
                theme = 2, -- 1 | 2 | 3 | 4 | 5 | 6 | 7  
                sizeNui = 1.2, -- Aument Nui : min 0.5 max 1.5 
                position = "topCenter", -- topLeft | topRight | middleLeft | middleRight | bottomLeft | bottomRight | center | topCenter | bottomCenter
                background = "https://t3.ftcdn.net/jpg/06/35/76/34/360_F_635763412_CUTNSVV8R7s5yPBsNwdRS5YuRGbojFav.jpg", -- 'url' | 'color' | 'rgb' | 'rgba' | '#HEX'  
                colors = {
                    color1 ="rgba(208, 182, 88, 0.8)", -- 'color' | 'rgb' | 'rgba' | '#HEX'
                    title = "rgba(190, 162, 61, 0.8)", -- 'color' | 'rgb' | 'rgba' | '#HEX'
                    description= "white",  -- 'color' | 'rgb' | 'rgba' | '#HEX'
                },
                anim = {
                    _start = "swing", -- effect start nui : https://www.theappguruz.com/tag-tools/web/CSSAnimations/
                    _end   = "wobble", -- effect end nui: https://www.theappguruz.com/tag-tools/web/CSSAnimations/
                },
            }
        },
        ['ambulance'] = {
            profile = "https://firelandsambulance.org/wp-content/uploads/2013/04/Firelands-EMT-Patch-1.png", 
            title = "LOS SANTOS AMBULANCE", 
            timer = {
                duration = 25, 
            },
            sound = {
                sound = "./music/2.wav", 
                soundVolume = 0.2, 
            },
            style = {
                theme = 2, 
                sizeNui= 1.2,
                position= "topCenter", 
                background= "rgba(216, 22, 30, 0.7)",
                colors = { 
                    color1 ="#D63438", 
                    title = "#1B1A6C",
                    description= "#FFFFFF",  
                },
                anim = {
                    _start = "swing",
                    _end   = "wobble", 
                },
            }
        },
        ['mechanic'] = { 
            profile = "https://static.wikia.nocookie.net/logopedia/images/6/69/Los_Santos_Customs_%28Alt%29.png", 
            title = "LOS SANTOS CUSTOMS", 
            timer = {
                duration = 25, 
            },
            sound = {
                sound = "./music/2.wav",
                soundVolume = 0.2, 
            },
            style = {
                theme = 2,
                sizeNui= 1.2,
                position= "topCenter", 
                background= "rgba(31, 26, 90, 0.7)", 
                colors = { 
                    color1 ="rgba(31, 26, 90, 0.9)", 
                    title = "#FFF000",
                    description= "#FFFFFF",  
                },
                anim = {
                    _start = "swing", 
                    _end   = "wobble", 
                },
            }
        },
        ['taxi'] = { 
            profile = "https://i.servimg.com/u/f11/19/77/62/97/84620_10.png",
            title = "DOWNTOWN CAB CO.", 
            timer = {
                duration = 25,
            },
            sound = {
                sound = "./music/2.wav",
                soundVolume = 0.2, 
            },
            style = {
                theme = 2, 
                sizeNui= 1.2, 
                position= "topCenter", 
                background= "rgba(255, 204, 0, 0.7)",   
                colors = { 
                    color1 ="rgba(255, 204, 0, 0.9)", 
                    title = "#010306", 
                    description= "#FD430A",  
                },
                anim = {
                    _start = "swing", 
                    _end   = "wobble", 
                },
            }
        },
        ['bahama'] = {
            profile = "https://static.wikia.nocookie.net/igniteroleplay/images/7/7b/BMsPinkLogo.png", 
            title = "BUSINESS: BAHAMA MAMAS",
            timer = {
                duration = 25, 
            },
            sound = {
                sound = "./music/2.wav",
                soundVolume = 0.2, 
            },
            style = {
                theme = 2, 
                sizeNui= 1.2, 
                position= "topCenter",
                background= "black", 
                colors = { 
                    color1 ="rgba(245, 40, 145, 0.8)", 
                    title = "rgba(245, 40, 145, 0.8)", 
                    description= "white", 
                },
                anim = {
                    _start = "swing", 
                    _end   = "wobble",
                },
            }
        },
    }
}

Translate = {
    ["cooldown"] = "You must wait %s second/s",
    ["notJob"] = "Your Work is not allowed to use this",
}

Webhook = "https://discord.com/api/webhooks/1296593670061162517/RteLrlyJOEWJqthIGoJmSBSdvL616gDA92D7g2xQF6zbudeICZRtaEUUVuakzUvuD7mx" -- nil | webhook

```

## Exports

If you want to be able to use the ad exports, you must refer to gx_announcejobv2/shared/custom.lua, to see what designs there are, and how to add more!
```ruby
> Using in client
    exports.gx_announcejobv2:Announce({
        theme = 'custom', 
        profile = 'https://media.tenor.com/dE-mXqu8cnMAAAAj/anonymous-man.gif',
        title = 'tittle',
        description = "this is a message", 
        timer = {
            duration = 10, 
        },
        sound = {
            sound = "./music/2.wav", 
            soundVolume = 0.2, 
        },
        style = {
            background = "white",
            sizeNui= 1.5,
            position= "topCenter", 
            anim = {
                _start = "swing", 
                _end   = "wobble", 
            }, 
        }
    })
> Using in server
    TriggerClientEvent('gx_announcejobv2:Announce', source, {
        theme = 'anonymous', -- gx_announcejobv2/shared/custom.lua
        profile = 'https://media.tenor.com/dE-mXqu8cnMAAAAj/anonymous-man.gif', -- nil | 'url'
        title = 'tittle', -- 'text'
        description = "this is a message", -- 'text'
        timer = {
            duration = 10, -- Duration of announce in seconds
        },
        sound = {
            sound = "./music/2.wav", -- nil | ./music/1.wav | Add sound here => gx_announcejobv2\web\music\1.wav
            soundVolume = 0.2, -- recommend 0.2  | Volume min 0.1 max 0.5
        },
        style = {
            background = "white", -- 'url' | 'color' | 'rgb' | 'rgba' | '#HEX'  
            sizeNui= 1.5, -- Aument Nui : min 0.5 max 1.5 
            position= "topCenter", -- topLeft | topRight | middleLeft | middleRight | bottomLeft | bottomRight | center | topCenter | bottomCenter
            anim = {
                _start = "swing", -- effect start nui : https://www.theappguruz.com/tag-tools/web/CSSAnimations/
                _end   = "wobble", -- effect end nui: https://www.theappguruz.com/tag-tools/web/CSSAnimations/
            }, 
        }
    })
```

## Preview

<div class="gallery-box">
<div class="gallery">
    <img src="/assets/img/2024-10-14-gx_announcejobv2/1.png"/>
    <img src="https://media.discordapp.net/attachments/1242112317953540218/1296518372187701300/image.png?ex=67129454&is=671142d4&hm=77eb1e1548beabfd3608a4e683213b66f3d698743b1c63e73429447205161c88&=&format=webp&quality=lossless"/>
    <img src="https://media.discordapp.net/attachments/1242112317953540218/1296518372749611098/image.png?ex=67129454&is=671142d4&hm=a1e9506adfb18fb8b34ce6b165f6ac365ec08c804eded61cc0d7ba6bddb30fbd&=&format=webp&quality=lossless">
    <img src="https://media.discordapp.net/attachments/1242112317953540218/1296518373064310855/image.png?ex=67129454&is=671142d4&hm=b450476b2d8e5f6f3d5a88ec9a8e62306d42ac777855c76033a68141570ba97d&=&format=webp&quality=lossless">
    <img src="https://media.discordapp.net/attachments/1242112317953540218/1296518373282152478/image.png?ex=67129454&is=671142d4&hm=202caee618970488b53f6d60e130695b6aac57ea13fa62543372f19f3a275f12&=&format=webp&quality=lossless">
    <img src="https://media.discordapp.net/attachments/1242112317953540218/1296519032580735133/image.png?ex=671294f1&is=67114371&hm=e0c82bc6538d3b9ab723e0f6c749000d3074d10a061d8c361e92f9c4bef86c45&=&format=webp&quality=lossless">
    <img src="https://media.discordapp.net/attachments/1242112317953540218/1296518373785731174/image.png?ex=67129454&is=671142d4&hm=7c0035f2c6e0d81de2477d8bbd1c974cc606bb3cb473a2866ce08a3108145803&=&format=webp&quality=lossless">
    <img src="https://media.discordapp.net/attachments/1242112317953540218/1296518374100041769/image.png?ex=67129454&is=671142d4&hm=12072e5b0f49fbbd5d3236def5516d17ca8e26e2e4340d82e91ba3711ad58e05&=&format=webp&quality=lossless">
    <img src="https://media.discordapp.net/attachments/1242112317953540218/1296518374347640832/image.png?ex=67129454&is=671142d4&hm=2f07f14edec8a400b8d7eb09c82ea1195bb421b36c44b841442caa51fd7141e4&=&format=webp&quality=lossless">
    <img src="https://media.discordapp.net/attachments/1242112317953540218/1296518382484721695/image.png?ex=67129456&is=671142d6&hm=75c5d7dafcfce306db2a61dd7baaae236f9666307ce755e550b2de81e8e11a0e&=&format=webp&quality=lossless">
    <img src="https://media.discordapp.net/attachments/1242112317953540218/1296519170552369183/image.png?ex=67129512&is=67114392&hm=d4e1041255120cd9cfe6bc951bf6ff9e474667abdb8ba0d4d2e81b042914bf02&=&format=webp&quality=lossless">
    <img src="https://media.discordapp.net/attachments/1242112317953540218/1296518373554917396/image.png?ex=67129454&is=671142d4&hm=59e82402a86b2685e76085d78b3d82ef773d3aecf6e1b9a8c575f3c21bf04fde&=&format=webp&quality=lossless&width=500&height=670">
    <img src="https://media.discordapp.net/attachments/1242112317953540218/1296614144732037163/image.png?ex=6712ed86&is=67119c06&hm=dd2dba0f0a45e73ec7e8b4cb79e958be660db95ea6cb4c424580f97cc4b7412e&=&format=webp&quality=lossless&width=512&height=671">
</div>
<em><a>ScreenShot of gx_announcejobv2</a></em>
</div>