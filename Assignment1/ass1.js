const axios = require('axios').default
const express = require('express')
const cors = require("cors")
const path= require("path")
const { get } = require('https')
const app = express()
const port = 3000
app.use(cors({
    origin: "*",
}))

let publicPath= path.resolve(__dirname,"public")
app.use(express.static(publicPath))

app.get('/:city', async function findWeather(req, res) {
    let city = req.params.city
    var response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&APPID=d99927812836fd5a45f1ffa872c0c4fe`)
    console.log(response.data)

    let lat = response.data.city.coord.lat
    let lon = response.data.city.coord.lon
    let cityWeather = response.data.list
    var pollutionRes = await axios.get(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=d99927812836fd5a45f1ffa872c0c4fe`)
    
    if (pollutionRes.status == 200){
        var tempAverages = []
        var tempAverage = 0
        var rainAverages = []
        var rainAverage = 0
        var windAverages = []
        var windAverage = 0

        var raining = false
        console.log(pollutionRes.data.list[0].components.pm2_5)
        var polluting = (pollutionRes.data.list[0].components.pm2_5 > 10 
            ? true 
            : false)

        cityWeather.forEach((x) =>{
            raining = ("rain" in x ? true: raining)
        })

        let properData = []
        cityWeather.forEach((x) => {

            let timeStamp = x.dt_txt.split(' ')[1]
            let dayOfTheWeek = x.dt_txt.split(' ')[0]
            if(timeStamp !== '00:00:00'){
                tempAverages.push(x.main.temp)
                tempAverage += x.main.temp
                windAverages.push(x.wind.speed)
                windAverage += x.wind.speed
                rainAverages.push("rain" in x ? x.rain['3h'] : 0)
                rainAverage += ("rain" in x ? x.rain['3h'] : 0)
            } else {
                tempAverage = tempAverage / tempAverages.length
                windAverage = windAverage / windAverages.length
                rainAverage = rainAverage / rainAverages.length
                if(tempAverage > 20){
                    packing = "Pack for Hot Weather!"
                } else if (tempAverage > 10) {
                    packing = "Pack for Warm Weather!"
                } else {
                    packing = "Pack for Cold Weather!"
                }
            
                let returnObj = {
                    "pack": packing,
                    "dayNumber": dayOfTheWeek,
                    "time": x.dt_txt,
                    "temp": tempAverage.toFixed(0),
                    "wind": windAverage.toFixed(1),
                    "rain": rainAverage.toFixed(1)
                }
                tempAverage = 0
                windAverage = 0
                rainAverage = 0
                tempAverages = []
                windAverages = []
                rainAverages = []
                properData.push(returnObj)
            }
        })
        res.send({
            "raining": raining,
            "polluting": polluting,
            "weatherData": properData
        })
    }
})
app.listen(port, () => console.log(`App listening on port ${port}`))



