/**
 * prepareData.js
 * Created by Raj on 2/4/2016.
 */
var curData=[],curLength;
var knownCategory={}, hashStorage;
var categories;
var validRow;
var fileName;
var delay=300;
var monthsGiven=0;
var indianapolis = {lat: 39.791, lng: -86.148};//Estimated from Data

var emptyDiv=$("#empty")[0];
var unwantedRTerms=[" Res "," PURCHASE","[A-Za-z]+:[A-Za-z]+","[0-9]+-[0-9]+","[ ]+[A-Za-z]+\\.[A-Za-z]+","[ ]+[0-9][0-9][0-9][0-9][0-9]+"];
var unwantedRight= new RegExp(unwantedRTerms.join("|"));
var unwantedLTerms=["ADY\\*"];
var unwantedLeft= new RegExp(unwantedLTerms.join("|"));


var cate=["Eating Out","Finance/Withdrawal","Groceries","Entertainment","Gas Station/Convenience Store","Transport","Housing",
    "Shopping","Miscellaneous"];


var service = new google.maps.places.PlacesService(emptyDiv);
var rowCount,newCount;
var origText="The user's transactions over 2 years will be drawn with the most expensive category at the top and the least at " +
    "the bottom.";


(function(){
    reset();
    scrollToTop();
    //service.textSearch({query:"dominos"}, function(results) {console.log(results);}); //Testing Api
})();

function choosePage(id) {
    location.hash =id;
}

function scrollToTop() {
    $("html, body").animate({scrollTop: 0}, 500);
}

//Resets KnowCategory JSON object
function reset(){
    console.log("Resetting Database");
    $.getJSON("data/knownCategory.json", function (data) {
        knownCategory=data;
    });
}

//Retrieves CSV files already stored
function per(sourceCsv) {
    fileName=sourceCsv;
    $.get("data/"+sourceCsv, function (data) {
        parser(data);
    });
}

//Uses CSV entered.
function enteredFiles() {
    var fileInput = $("#files")[0];
    if(fileInput.files[0]) {
        console.log(fileInput.files[0]);
        fileName = fileInput.files[0].name;
        parser(fileInput.files[0]);// Only parsing first file currently
    }
}

//Parses entered CSV using PapaParse library
function parser(inputData){
    Papa.parse(inputData, {
        complete: function(results) {
            curData=results.data;
            curLength=curData.length;
            choosePage('#results');
        }
    });
}

//Modifies well known Keys using reg expressions saved
function correctKeys(){
    $("#result").html("");
    validRow=0;
    for (var i=0; i<curLength;i++){
        var temp = curData[i][1];
        if(temp) {
            validRow++;
            while (unwantedRight.test(temp)) {
                temp=temp.split(unwantedRight)[0];
            }
            while (unwantedLeft.test(temp)) {
                temp=temp.split(unwantedLeft)[1];
            }
            curData[i][1] = temp;
        }
    }
    while(curLength>validRow)//Popping empty element arrays at the end of CurData
        {
            curData.pop();curLength--;console.log("Found "+validRow+" valid rows and Curlen gth " +curLength);
        }
    curData.sort(d3.ascending);//Sorting possibly incorrect date order like Person A,B
    newCount=rowCount=0;
    monthsGiven=Math.floor((parse(curData[curLength-1][0])-parse(curData[0][0]))/(1000*60*60*24*31 ));
    getCategory();
}

//Gets Categories for Keys wither from KnownCategory Object or using Google Places API
function getCategory(){
    if( rowCount< curLength) {
        $("#caption").html("<h4>Working... " +Math.floor(100*rowCount/curLength)+"% "+ delay+"ms Delay</h4>");
        var key=curData[rowCount][1];
        if(key in knownCategory)
        {
            curData[rowCount][3] = knownCategory[key];
            rowCount++;
            getCategory();
        }
        else
        {
            newCount++;
            setTimeout(function(){
                googleCategory(key);
            }, delay);
        }
    }else{
        console.log("Number of Google details requests made "+newCount);
        createArrayForPLot();//setGraph(curData);Old Data with gaps category info
    }
}

//Does a service call to google Places API to get Array of likely Categories
function googleCategory(key) {
    service.textSearch({query:key}, function(results, status,pagination) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            categories = results[0].types.slice(0, 2);
            knownCategory[key]=categorySpecification(key);
            curData[rowCount][3] = knownCategory[key];
        }
        else if(status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT || status !== google.maps.places.PlacesServiceStatus.OK){
            delay+=50;
            console.log("Google API Fail Row "+status +""+ rowCount);
            curData[rowCount][3] = cate[8];
                rowCount--;// -1 so coming + 1 will redo this call
        }
        rowCount++;
        getCategory();
    });
}

//Is the Category there?
function isCategory(str) {
    for (var i = 0; i < categories.length; i++) {
        if (categories[i] === str) {
            return true;
        }
    }
    return false;
}

//Is word in Category there?
function inCategoryKeyWord(str) {
    for (var i = 0; i < categories.length; i++) {
        if (categories[i].search(str)>(-1)) {
            return true;
        }
    }
    return false;
}

//Finally sets the Category for the key to a generic term like "Eating Out" for all types of Restaurants,bakeries,bars,etc
function categorySpecification(key){
    var result=cate[8];

    if(isCategory("establishment") || isCategory("point_of_interest"))
        result=cate[0];
    if(isCategory("food") ||isCategory("restaurant") || isCategory("bar") || isCategory("cafe") || isCategory("meal_delivery")  || isCategory("meal_takeaway") || isCategory("bakery"))
        result=cate[0];
    if(isCategory("finance") || isCategory("atm") || isCategory("bank"))
        result=cate[1];
    if(inCategoryKeyWord("store"))
        result=cate[7];
    if(isCategory("grocery_or_supermarket") || isCategory("department_store") || isCategory("home_goods_store") )
        result=cate[2];
    if(isCategory("movie_theater") || isCategory("movie_rental") || isCategory("amusement_park") || isCategory("stadium") || isCategory("bowling_alley")|| isCategory("park"))
        result=cate[3];
    if(isCategory("route")|| isCategory("bus_station") || isCategory("airport") || isCategory("taxi_stand") || isCategory("train_station")  || isCategory("car_rental") || isCategory("parking"))
        result=cate[5];
    if(isCategory("gas_station") || isCategory("convenience_store") || key=="MOBILE GAS")
        result=cate[4];

    switch(key){
        case "Uber BV":
            result=cate[5];
            break;
        case "Netflix":
            result=cate[3];
            break;
        case "FirstService":
        result=cate[6];
        break;
        case "AMAZON":
        case "PAYPAL ":
        case "NORDSTROM ONLINE":
            result=cate[7];
            break;
    }
    return result;
}

//Need to make a Complete array with Categories whether purchased or not on each day given.
function createArrayForPLot(){
    hashStorage={};
    var plotArray=[];
    var tDate= curData[0][0];

    var temp=objTemplate(tDate,curData[0][3],curData[0][2]);
    for(var i=1; i<curLength;i++){
        if(curData[i][0]!= tDate){
            plotArray.push.apply(plotArray, temp);
            tDate = curData[i][0];
            temp=objTemplate(tDate,curData[i][3],curData[i][2]);
        }else{
            temp=modifyObject(temp,tDate,curData[i][3],curData[i][2]);//Should we come across multiple transactions on the same day.
        }
    }
    plotArray.push.apply(plotArray, temp);//remember to put push for last element
    scrollTo("#caption");
    $("#caption").html("<h4>Now using <b>"+fileName+"</b></h4><h4>"+origText+" </h4><h4>The Y-Axis($) scales are different for each category and you'll notice the closer the peaks of a waveform are, the more frequent is the spending in the category.</h4>");

    setGraph(plotArray);
}

//Maps the cost or adds it should there be more than one Category purchase on the same day
function costMapper(date,rCat,category,cost){
    if(rCat != category)
        cost=0;
     var keyCateDate=rCat+date;

    if(keyCateDate in hashStorage){
        hashStorage[keyCateDate] = +hashStorage[keyCateDate]+ +cost;
    }else{
        hashStorage[keyCateDate] = +cost;
    }

    return hashStorage[keyCateDate];
}

//Used to modify Object already created in ObjTemplate
function modifyObject(temp,tDate,category,cost){
    temp[cate.indexOf(category)].cost=costMapper(tDate,category,category,cost);
    return temp;
}

//Gives the template of each row of Array which is an Object containing Date,Category, Cost
function objTemplate(tDate,category,cost){
        return ([
            {date: tDate,
                category: cate[0],
                cost:costMapper(tDate,cate[0],category,cost)},
            {date: tDate,
                category:cate[1],
                cost:costMapper(tDate,cate[1],category,cost)},
            {date: tDate,
                category:cate[2],
                cost:costMapper(tDate,cate[2],category,cost)},
            {date: tDate,
                category:cate[3],
                cost:costMapper(tDate,cate[3],category,cost)},
            {date: tDate,
                category:cate[4],
                cost:costMapper(tDate,cate[4],category,cost)},
            {date: tDate,
                category:cate[5],
                cost:costMapper(tDate,cate[5],category,cost)},
            {date: tDate,
                category:cate[6],
                cost:costMapper(tDate,cate[6],category,cost)},
            {date: tDate,
                category:cate[7],
                cost:costMapper(tDate,cate[7],category,cost)},
            {date: tDate,
                category:cate[8],
                cost:costMapper(tDate,cate[8],category,cost)}
        ]);
}