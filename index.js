async function readAndDraw(){
  const budget = await d3.csv('BudgetBreakdown.csv');
  const country = 'Japan'

  // budget for a country and all 18 economies
  const ctryBudget = budget.filter(d => d.Economy == country);
  // const allBudget = budget.filter(d => d.Economy == "18 economies");

  const ctryBudget_ = ctryBudget.filter(d => d.Source != "Other").sort((a, b) => (+b.Value) - (+a.Value));
  //const categsOrder = ctryBudget_.map(d => d.Source)
  // const allBudget_ = allBudget.filter(d => d.Source != "Other").sort((a, b) => categsOrder.indexOf(b.Source) - categsOrder.indexOf(a.Source));

  console.log(ctryBudget_);

  const margin = {
    top: 20,
    bottom: 20,
    right: 45,
    left: 45
  };

  let scaleColor = d3.scaleOrdinal()
                   .domain([
                     'Foreign funding',
                     'Individual donors',
                     'Government grant',
                     'Government procurement',
                     'Corporate funding',
                   ])
                   .range([
                     '#173158',
                     '#144632',
                     '#5c607f',
                     '#25408f',
                     '#faa61a'
                   ]);

  const width = 850 - margin.right - margin.left;
  const height = 400 - margin.top - margin.bottom;

  const svgG = d3.select('svg.bubbleViz')
                  .append('g')
                  .attr('class', 'bubGrp')
                  .attr('transform', "translate(45, 20)" );

  const totalCategs = ctryBudget_.length;
  const cellWidth = width/totalCategs;

  const maxPerc = d3.max(ctryBudget_.map(d => +d.Value));
  const minPerc = d3.min(ctryBudget_.map(d => +d.Value));

  const radScale = d3.scaleSqrt()
                    .domain([0, maxPerc])
                    .range([0, cellWidth/2]);

  const circlesAsia = svgG.selectAll('circle.asia')
                      .data(ctryBudget_)
                      .enter()
                      .append('circle')
                      .attrs({
                        class: d => `asia ${d.Source}`,
                        cx: (d, i) => i * cellWidth + (cellWidth/2),
                        cy: (d, i) => height/ 2,
                        r: 0
                      })
                      .styles({
                        'fill': 'teal',
                        'fill-opacity': 1,
                        'stroke': 'black'
                      });

  const circles = svgG.selectAll('circle.ctr')
                      .data(ctryBudget_)
                      .enter()
                      .append('circle')
                      .attrs({
                        class: d => `ctr ${d.Source}`,
                        cx: (d, i) => i * cellWidth + (cellWidth/2),
                        cy: (d, i) => height/ 2,
                        r: d => radScale(d.Value)
                      })
                      .styles({
                        'fill': d => scaleColor(d.Source)
                      });


  circlesAsia.filter(d => +d.Value18 < +d.Value)
            .raise();


  const textLab = svgG.selectAll('text.label')
                      .data(ctryBudget_)
                      .enter()
                      .append('text')
                      //.text(d => d.Source)
                      .attrs({
                        class: 'label',
                        x: (d, i) => i * cellWidth + (cellWidth/2),
                        y: (d, i) => height - 50,
                      })
                      .selectAll('tspan')
                      .data((d, i) => {
                        const splitword = d.Source.split(" ");
                        const index = i;
                        const dat = [];
                        for (i = 0; i < splitword.length; i++){
                          obj = {}
                          obj['name'] = splitword[i];
                          obj['index'] = index;
                          dat.push(obj);
                        }
                        return dat;
                      })
                      .enter('tspan')
                      .append('tspan')
                      .text(d => d.name)
                      .attr('x', (d, i) => d.index * cellWidth + (cellWidth/2))
                      .attr('dy', (d, i) => i == 0 ? `0px` : `20px`)
                      .styles({
                        'fill': '#212121',
                        'text-anchor': 'middle',
                        'font-family': 'DinProReg'
                      });

  const percLabelFontScale = d3.scaleLinear()
                                .domain([minPerc, maxPerc])
                                .range([10, 18])

  const percLabels = svgG.selectAll('text.percLabel')
                      .data(ctryBudget_)
                      .enter()
                      .append('text')
                      .attrs({
                        class: 'percLabel',
                        x: (d, i) => i * cellWidth + (cellWidth/2),
                        y: (d, i) => (height/ 2) + percLabelFontScale(d.Value)/3,
                      })
                      .text(d => `${d.Value}%`)
                      .styles({
                        'fill': (d, i) => d.Value == 0 ? '#212121' : 'white',
                        'text-anchor': 'middle',
                        'font-family': 'DinProReg',
                        'font-size': (d, i) => `${percLabelFontScale(d.Value)}px`
                      });

  const catchRects = svgG.selectAll('rect.catch')
                      .data(ctryBudget_)
                      .enter()
                      .append('rect')
                      .attrs({
                        class: 'catch',
                        x: 0,
                        y: 0,
                        width: cellWidth - 1,
                        height: 400,
                        transform: (d, i) => `translate(${i*cellWidth}, ${0})`
                      })
                      .styles({
                        'fill': 'grey',
                        'fill-opacity': 0.0
                      });

  catchRects.on('mouseover', function(d, i){
    const source = d3.select(this).datum().Source;
    const value = d3.select(this).datum().Value18;

    svgG.selectAll('circle.asia')
                            .filter(d => d.Source == source)
                            .transition("mouseOver")
                            .attr('r', d => radScale(d.Value18));

    svgG.selectAll('circle.ctr')
                            .filter(d => d.Source == source)
                            .transition("mouseOver")
                            .duration(250)
                            .style('fill', 'white')
                            .style('stroke', 'black');

    svgG.selectAll('text.percLabel')
                            .filter(d => d.Source == source)
                            .transition("mouseOver")
                            .duration(250)
                            .style('fill', d => +d.Value18 > +d.Value ? '#212121' : '#ffffff');


    const eventX = d3.event.x;
    const eventY = d3.event.y;

    d3.select('body').append('div')
                    .classed('tooltip', true)
                    .html(
                      (d, i) =>
                      `
                        <p>
                          <span class='varName'>Average of 18 economies</span><br>
                          <span>${value}%</span><br>
                        </p>
                      `
                    )
                    .styles({
                      position: 'fixed',
                      width: '150px',
                      left: `${(i * cellWidth + (cellWidth/2)) - 68 + margin.left}px`,
                      top: `50px`,
                      background: '#eee',
                      'border-color': '#212121',
                      opacity: 0.9,
                      'font-family': "DinProReg",
                      'font-size': '12px'
                    })

  });

  catchRects.on('mouseout', function(d, i){
    const source = d3.select(this).datum().Source;

    const circlesAsia = svgG.selectAll('circle.asia')
                            //.filter(d => d.Source == source)
                            .transition("mouseOut")
                            .attr('r', 0);

    svgG.selectAll('circle.ctr')
                            .filter(d => d.Source == source)
                            .transition("mouseOut")
                            .duration(250)
                            .style('fill', d => scaleColor(d.Source))
                            .style('stroke', 'none');

    svgG.selectAll('text.percLabel')
                            .filter(d => d.Source == source)
                            .transition("mouseOut")
                            .duration(250)
                            .style('fill', d => d.Value != 0 ? 'white' : '#212121');

    d3.select('body').select('div.tooltip').remove();


  })





}

readAndDraw();
