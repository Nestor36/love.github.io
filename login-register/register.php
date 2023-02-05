<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>GuxFiz</title>
	<link rel="stylesheet" href="style.css">
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.4.1/dist/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
</head>
<script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@4.4.1/dist/js/bootstrap.min.js" integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6" crossorigin="anonymous"></script>
<script> 
			function mostrarContrasena(){
				var tipo = document.getElementById("password");
				if(tipo.type == "password"){
					tipo.type = "text";
				}else{
					tipo.type = "password";
				}
			}

	function ventanaSecundaria (URL){ 
	window.open(URL,"ventana1","width=10,height=10,scrollbars=no, toolbar=no, locationbar=no, tittlebar=no, status=yes") 
	}	
</script>
<body>

<div>
	<button  align="center" class="glow-on-hover" type="button" onclick="javascript:ventanaSecundaria('http://22203.live.streamtheworld.com/CRP_PLA_SC')">▶</button>
</div>
	<div class="box-register">
		<form method="post" autocomplete="off" action="register-src.php">
			
			<h2 class="button-login">Register</h2>
			<?php

			$recargar_webpage = '<meta http-equiv="refresh" content="50;URL=\'register.php\'" />';
			$error_1001 = "";
			$error_1002 = "";
			if(isset($_GET["error"]) and $_GET["error"] == "1001") {
				$error_1001 = "<div style='color:red' align='center'>Contraseña no coincide </div>";
				$recargar_webpage;
			}
			elseif (isset($_GET["error"]) and $_GET["error"] == "1002") {
				$error_1002 = "<div style='color:red' align='center'>Correo no Válido </div>";
				$recargar_webpage;
			}
			elseif (isset($_GET["error"]) and $_GET["error"] == "1003"){
				echo $error_1001;
				echo $error_1002;
			}

			echo $error_1001;
			echo $error_1002;
			
			?>
			<div class="contened-linea-reg">
				<div class="inputBox">
					<input type="text" name="datanombre" required="required">
					<span>Nombres</span>
					<i></i>
				</div>
				<div class="inputBox">
					<input type="text" name="dataapellido" required="required">
					<span>Apellidos</span>
					<i></i>
				</div>
			</div>

			<div class="inputBox">
				<input type="text" name="dataemail" required="required">
				<span>Correo</span>
				<i></i>
			</div>
			<div class="contened-linea-reg">
				<div class="inputBox">
					<input type="password" id="password" name="datapassword" required="required">
					<span>Contraseña</span>
					<i></i>
				</div>
				
				<div class="inputBox">
					<input type="password" id="confirm_password" name="datapassword2" required="required">
					<span>Confirmar Contraseña</span>
					<i></i>
				</div>
 			</div>

			<div class="inputBox">
				<input type="password" name="datakey" required="required">
				<span>Key</span>
				<a></a>
			</div>

			<div class="links">
				<a></a>
				<a href="index.php">Iniciar sesión</a>
			</div>

			<input type="submit" value="Registrarse">

		</form>
	</div>
	<div>
<tatble>
	<tr><td><p class="oblique" style="color:white">Contador de Visitantes</p></td></tr>
		</table>
<div align="center" id="sfc5qf557xw2zfrn6ushcattf5k4bzltkrr"></div>
<script type="text/javascript" src="https://counter4.optistats.ovh/private/counter.js?c=5qf557xw2zfrn6ushcattf5k4bzltkrr&down=async" async></script>
<noscript><img src="https://counter4.optistats.ovh/private/contadorvisitasgratis.php?c=5qf557xw2zfrn6ushcattf5k4bzltkrr" border="0" alt="contador de visitas gratis"></a></noscript>
		</div>

</body>
</html>




<!--

Enlace para ofuscar code - https://bloggerwebtools.blogspot.com/2018/03/ofuscador-de-codigo-html-blogger.html

https://www.protegerhtml.com/index.php

-->