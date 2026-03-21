function analisar(){

let trafego = document.getElementById("trafego").value;

let mensagem = "";

if(trafego === "leve"){
mensagem = "Trânsito tranquilo. Você pode sair no horário planejado.";
}

else if(trafego === "moderado"){
mensagem = "Trânsito moderado. Considere sair 10 minutos antes.";
}

else{
mensagem = "Trânsito intenso. Recomendamos sair 20 a 30 minutos antes.";
}

document.getElementById("resultado").innerText = mensagem;

}