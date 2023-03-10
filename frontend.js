if (document) {
  if (!document.getElementById('start_date').value) {
    document.getElementById('start_date').value = moment().subtract(5, 'months').toISOString().substr(0, 10);
  }
  if (!document.getElementById('end_date').value) {
    document.getElementById('end_date').value = new Date().toISOString().substr(0, 10);
  }
}

let formProps
const form = document.getElementById('form');
form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);
  formProps = Object.fromEntries(formData);

  console.log('init with form data ', formProps)
  initHeatmap()
});

function setLoading(loading) {
  document.querySelector("#heatmap").innerHTML = loading
}
function initHeatmap() {
  setLoading('loading...')

  // Fetch data from the node.js server, returns a promise with json data
  function fetchData() {
    return fetch('http://10.109.64.133:9876/', {
      method: "GET"
    }).then(function (response) {
      return response.json()
    }, function (error) {
      console.log("ERRORRRRRRRRRRR", error.message); //=> String
    })
  }

  // generate calendar weeks from start_date to end_date
  let week = moment(formProps.start_date).week()
  const calendarWeeks = [week]
  let timestamp = moment(formProps.start_date).unix()
  let lastTimestamp = moment(formProps.endDate).unix()
  let weeksToAdd = 1
  while (timestamp <= lastTimestamp) {
    week = moment(formProps.start_date).add(weeksToAdd, 'weeks').week()
    timestamp = moment(formProps.start_date).add(weeksToAdd, 'weeks').unix()
    weeksToAdd++
    calendarWeeks.push(week)
  }
  console.log("Calendar weeks between ", moment(formProps.start_date).week(), moment(formProps.end_date).week(), calendarWeeks)

  function getSelectValues(select) {
    var result = [];
    var options = select && select.options;
    var opt;

    for (var i = 0, iLen = options.length; i < iLen; i++) {
      opt = options[i];

      if (opt.selected) {
        result.push((opt.value || opt.text).toLowerCase());
      }
    }
    return result;
  }

  fetchData()
    .then(function (data) {
      console.log("DATA FROM SERVER", data)
      const APPS = data.object
      const series = []

      let i = 0
      for (app of APPS) {
        //if (app.uniqueId.indexOf('LAPI') > -1) {
        console.log("app: ", app, "# scans = " + app.scans.length)

        series.push({
          id: app.uniqueId,
          name: app.name,
          data: generateData(app)
        })
        //}
        // TODO: how many (which) apps?
        if (++i > 10)
          break
      }

      setLoading('')

      console.log("verteilung", series);
      let options = {
        series: series, // array for the data
        chart: {
          //height: 350,
          type: 'heatmap',
        },
        dataLabels: {
          formatter: function (val, opts) {
            // TODO. this is wrong!

            //console.log(val, opts)
            const seriesValue = series[opts.seriesIndex]
            // const dataOfSeriesValue = seriesValue.data[opts.dataPointIndex]
            const app = APPS.find((app) => { return app.uniqueId === seriesValue.id })
            //console.log("YES",seriesValue.name,  app)
            // TODO: no sense. discuss reqs with team and fix this "scans" issue
            // const scan = app.scans[opts.dataPointIndex] // TODO. WTF? :D
            return [
              ' TODO'
              //'Critical: ' + scan.numberCriticalVulnerabilities + ' High: ' + scan.numberHighVulnerabilities,
              //'Medium: ' + scan.numberMediumVulnerabilities + ' Low: ' + scan.numberLowVulnerabilities,
            ];
          },
          //offsetY: -15,
          style: {
            fontSize: "8px",
          },
        },
        plotOptions: {
          heatmap: {
            shadeIntensity: 0.5,
            radius: 0,
            useFillColorAsStroke: true,
            // https://apexcharts.com/react-chart-demos/heatmap-charts/color-range/
            // TODO
            /*Following colors should be applied (depending on definied threshholds): 
              Blue (no information available) #002dee
              Light Green (weighted_criticality < th1) 0df31e
              Dark Green (th1 < weighted_criticality < th2) 008000
              Yellow (th2 < weighted_criticality < th3) FFFF00
              Orange  (th3 < weighted_criticality < th4) FF7F00
              Red (th4 < weighted_criticality < th5)  FF0000
              Dark-Red (th5 < weighted_criticality) a71a17
              */
            // REQ: The fields of the heat map should be colored depending on the defined thresholds for application vulnerabilities. 

            colorScale: {
              ranges: [{
                from: verteilung[0][0],
                to: verteilung[0][1],
                name: 'none',
                color: '#002dee' // blue
              },
              {
                from: verteilung[1][0],
                to: verteilung[1][1],
                name: 'info',
                color: '#0df31e' // Light Green
              },
              {
                from: verteilung[2][0],
                to: verteilung[2][1],
                name: 'low',
                color: '#008000' // Dark Green
              },
              {
                from: verteilung[3][0],
                to: verteilung[3][1],
                name: 'med',
                color: '#FFFF00' // yellow
              },
              {
                from: verteilung[4][0],
                to: verteilung[4][1],
                name: 'high',
                color: '#FF7F00' // orange
              },
              {
                from: verteilung[5][0],
                to: verteilung[5][1],
                name: 'critical',
                color: '#FF0000' // red
              },
              {
                from: verteilung[6][0],
                to: verteilung[6][1],
                name: 'very critical',
                color: '#a71a17' // dark red
              }
              ]
            }
          }
        },
        // colors: [],
        title: {
          text: 'Threadfix HeatMap Chart'
        },
      };

      var chart = new ApexCharts(document.querySelector("#heatmap"), options);
      chart.render();
      /*chart.updateSeries([{
          name: 'Sales',
          data: response.data
      }])*/
    })

  function generateData(app) {
    const yrange = {
      min: 0,
      max: 90
    }

    /*for (scan of app.scans) {
      console.log(moment(scan.importTime).week(), scan.importTime, new Date(scan.importTime))
    }*/

    const series = [];
    for (let calendarWeek of calendarWeeks) { // ?
      // console.log("checking scans in CW ", calendarWeek)

      const selectedScanners = getSelectValues(document.getElementById('scanner'));

      const scansOfCurrentWeek = app.scans.filter(scan => {
        const weekFound = moment(scan.importTime).week() === calendarWeek
        if (selectedScanners[0] === 'all') {
          return weekFound
        }
        else {
          // TODO: TEST THIS! ggf doch unit tests irgendwie? index.js und tests.js !
          // selectedScanners = ['kiuwan', 'acunetix']
          const scannerMatch = selectedScanners.find(scanner => {
            // console.log(scanner, scan.scannerName);
            return scan.scannerName.indexOf(scanner > -1)
          })

          return weekFound && scannerMatch
        }
      })

      //throw "EE"
      // console.log("scansOfCurrentWeek", scansOfCurrentWeek);

      // TODO: was tun wenn mehr scans in der woche? sum? last?
      let y
      if (scansOfCurrentWeek && scansOfCurrentWeek.length) {
        let scan = scansOfCurrentWeek[scansOfCurrentWeek.length - 1]
        const info = scan.numberInfoVulnerabilities
        const low = scan.numberLowVulnerabilities
        const med = scan.numberMediumVulnerabilities
        const high = scan.numberHighVulnerabilities
        const critical = scan.numberCriticalVulnerabilities
        const sumWeights = info + low + med + high + critical
        // console.log(sumWeights); === scan.numberTotalVulnerabilities
        const avg = sumWeights === 0 ? 0 : (
          formProps.factor_info * info +
          formProps.factor_low * low +
          formProps.factor_medium * med +
          formProps.factor_high * high +
          formProps.factor_critical * critical
        ) / sumWeights

        // console.log("CALCULATION: ", info, low, med, high, critical, ' = ', avg);

        y = avg

      }
      else {
        y = 0
      }

      const x = 'CW' + calendarWeek
      series.push({
        x: x,
        y: y
      });
    }

    return series;
  }
}
