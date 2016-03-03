/*
Graph Implementation
 * Created by Raj on 2/4/2016.
 */
var m = [10, 20, 30, 40],
    w1=$("#center").width(),
    w = w1 - m[3] ,//previously 1200px
    h = 560  - m[1];//540

var inc=3,x, y, y1, duration=1000; // inc changes the speed
var parse = d3.time.format("%Y-%m-%d").parse;
var hashStorage;
var color = d3.scale.category10();
var svg;

function setSVG(){
    w1=$("#center").width(); w = w1 - m[3];
    svg = d3.select("#graph1").append("svg")
        .attr("width", w + m[3] )
        .attr("height",h + m[1]+m[3])//540
        .append("g")
        .attr("transform", "translate(" + m[3] + ",0)");
}

var expenditure,categories;

// A line generator, for the dark stroke.
var line = d3.svg.line()
    .interpolate("basis")
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.cost); });

//Tells whether this exact purchase was done before
function uniqueExpenseCounter(category,cost){
    if(cost==0)
    return 0;
    var key=category+cost;

    if(key in hashStorage){
        return 0;
    }else{
        hashStorage[key] = cost;
        return 1;
    }
}

//Sets the values for the graph to be drawn from data complied in prepareData.js
function setGraph(data) {
    hashStorage={};

    // Nest spending values by categories.
    categories = d3.nest()
        .key(function(d) { return d.category; })
        .entries(expenditure = data);

    // Parse dates. values should be sorted by date by now.
    // Calculating sum of costs to sort categories by.
    // Also compute the maximum price per category, needed for the y-domain.
    //All other data used for results display
    categories.forEach(function(s) {
        s.values.forEach(function(d) { d.date = parse(d.date);  });
        s.uniqueCount=d3.sum(s.values,  function(d) {
            return uniqueExpenseCounter( s.key, d.cost);
        });
        s.days=d3.sum(s.values,  function(d) {
            if( d.cost!=0)
            return 1;
            else return 0;
        });
        s.deviation=d3.deviation(s.values,  function(d) {
            if( d.cost!=0)
            return d.cost;
            else
            return null;
        });
        s.maxPrice = d3.max(s.values, function(d) { return d.cost; });
        s.sumPrice = d3.sum(s.values, function(d) { return d.cost; });
        s.avgPer3m= (s.sumPrice/Math.floor(monthsGiven/3)).toFixed(2);
        s.avgPerM= (s.sumPrice/monthsGiven).toFixed(2);
        s.avgPerD= (s.sumPrice/s.days).toFixed(2);
        s.freqPerM= Math.floor(s.days/monthsGiven);
    });

    // Sort by maximum price, descending. Giving us order of Keys.
    categories.sort(function(a, b) { return b.sumPrice - a.sumPrice; });

    svg.selectAll("*").remove();//Clearing first

    svg.selectAll("g")
        .data(categories)
        .enter()
            .append("g")
            .attr("class", "categories");

    console.log(categories);
    setTimeout(lines,duration);
}

//The function used to draw each waveform for each category
function lines() {
    x = d3.time.scale().range([0, w - (w/10)]);
    y = d3.scale.linear().range([h / 9 -5, 0]);
    y1 = d3.scale.linear().range([h / 9 -23 , 0]);

    // Compute the minimum and maximum date across categories.
    x.domain([
        d3.min(categories, function(d) { return d.values[0].date; }),
        d3.max(categories, function(d) { return d.values[d.values.length - 1].date; })
    ]);

    var yAxis = d3.svg.axis()
        .scale(y1)
        .ticks(3)
        .orient("left");

    var xAxis=d3.svg.axis()
        .ticks(d3.time.months, 1)
        .tickFormat(d3.time.format("%b"))
        .orient("bottom")
        .scale(x);

    svg.append("g")
        .attr("transform", "translate(0," +(h +m[0]) +" )")
        .attr("class", "axis")
        .call(xAxis);

    var g = svg.selectAll(".categories")
        .attr("transform", function(d, i) { return "translate(0," + (i * (h / 9) ) + ")"; });


    g.each(function(d) {
        var e = d3.select(this);

        e.append("path")
            .attr("class", "line")
            .style("stroke", function(d) { return color(d.key); });

        e.append("circle")
            .attr("r", 5)
            .style("fill", function(d) { return color(d.key); })
            .style("stroke", "#000")
            .style("stroke-width", "2px");

        e.append("text")
            .attr("x", 12)
            .attr("width",100)
            .attr("dy", ".31em")
            .text(d.key);

        e.append("g")
            .attr("transform", "translate(-5,18)")
            .attr("class", "axis");

    });

    function draw(k) {
        g.each(function(d) {
            var e = d3.select(this);
            y.domain([0, d.maxPrice]);y1.domain([0, d.maxPrice]);

            e.select("g").call(yAxis);

            e.select("path")
                .attr("d", function(d) { return line(d.values.slice(0, k + 1)); });

            e.selectAll("circle, text")
                .data(function(d) { return [d.values[k], d.values[k]]; })
                .attr("transform", function(d) { return "translate(" + x(d.date) + "," + y(d.cost) + ")"; });


        });
    }

    var k = 1, n = categories[0].values.length;
    d3.timer(function() {
        draw(k);
        k+=inc;
        if (k >= n - 1) {
            draw(n - 1);
            printResults();
            return true;
        }
    });
}

//Prints the calculated Results //TO-DO: Should be updated to use Angular...
function printResults(){
    var i,cKey,sum,avgPer3m,row;
    var temp="<h4>Results:</h4>";
    var budget=0;
    var freqArr=[];
    for(i=0;i<categories.length;i++){
        budget+=categories[i].sumPrice;
        row={freq:categories[i].freqPerM, key:categories[i].key};
        freqArr.push(row);
    }
    freqArr.sort(function(a, b){return b.freq - a.freq});
    //console.log(freqArr);
    for(i=0;i<categories.length;i++){
        cKey=categories[i].key;
        sum=categories[i].sumPrice.toFixed(2);
        avgPer3m=categories[i].avgPer3m;
        temp+="<br/><h4>"+(i+1)+") <b>"+cKey+"</b> Total money spent on " +cKey+": $"+sum ;
        temp+="</h4><h4> Impact on user's budget: "+(100*sum/budget).toFixed(2)+"%" ;
        temp+="</h4><h4> Average money spent in 3 months : $"+avgPer3m ;
        temp+="</h4><h4> Spending on " +cKey+" on average is done approximately "+categories[i].freqPerM+" time(s) a month. </h4>" ;
        if(categories[i].uniqueCount>0 && categories[i].uniqueCount<=3 && categories[i].freqPerM>0 && categories[i].freqPerM<=2){
            temp+="<h4 class='important'>Appears to be periodic hence assumed necessary to user. Is it? Recommend looking for cheaper alternative.</h4>"
        }
        if(cKey == freqArr[0].key){
            temp+="<h4 class='important'>"+cKey +" is your most frequent expense. Recommend cutting down.</h4>";
        }
        if(cKey == freqArr[1].key){
            temp+="<h4 class='important'>"+cKey +" is your second most frequent expense. Recommend cutting down.</h4>";
        }
    }
    $("#result").html(temp);
    setTimeout(function(){scrollTo("#result");},duration);
}

//Scrolling function for Ids.
function scrollTo(id) {
    var position = $(id).position();
    $("html, body").animate({scrollTop: position.top}, 500);
}