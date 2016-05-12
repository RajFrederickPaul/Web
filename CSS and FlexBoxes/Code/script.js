/**
 * Created by Raj on 4/22/2016.
 */

"use strict";
$( document ).ready(function() {
    var slider=document.getElementsByClassName("slider")[0];
    var meter=document.getElementsByClassName("meter")[0];
    var mercury= document.getElementsByClassName("mercury")[0];
    var baseLeft=12.5,baseMercWidth=25;


    var thermometer= document.getElementsByClassName("thermometer")[0];//Part of this test is to add notches dynamically
    var node;
    for(var i=0;i<4;i++){//Adding the notches on thermometer
        node = document.createElement("div");
        node.className = "notches";
        node.style.left= baseLeft+(i*baseMercWidth)+"%";
        thermometer.appendChild(node);
    }

    $('input:radio').on('change', function(){sliderChange($(this).attr('id'));});

    function sliderChange(radioID){
        $('label').removeClass('checked');
        $("#"+radioID).parent().addClass('checked');
        var value= radioID.split("setTo")[1];
        var changedPercent=(+value-1)*(baseMercWidth);
        $(".slider").first().css('left',  (baseLeft+ (changedPercent)+'%'));//Moving Slider
        mercury.style.width= baseLeft+(changedPercent)+"%";//Resizing Mercury div
    }

    $("#setTo1").prop("checked", true);
    sliderChange("setTo1");
});