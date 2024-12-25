"use client"

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const generateActigraphyData = (hours = 24) => {
  const data = []
  for (let hour = 0; hour < hours; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const timeOfDay = hour + minute/60
      const isActive = hour >= 7 && hour <= 22
      const activityLevel = isActive ? 
        (0.5 + 0.5 * Math.sin(timeOfDay * Math.PI / 12)) * (1 + Math.random() * 0.3) : 
        0.1 * Math.random()

      data.push({
        timestamp: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        timeValue: timeOfDay,
        X: activityLevel * Math.sin(timeOfDay) + Math.random() * 0.2,
        Y: activityLevel * Math.cos(timeOfDay) + Math.random() * 0.2,
        Z: activityLevel * Math.sin(timeOfDay * 2) + Math.random() * 0.2,
        enmo: activityLevel,
        anglez: 45 * Math.sin(timeOfDay * Math.PI / 12)
      })
    }
  }
  return data
}

export default function FenetresAnalyse() {
  const [data, setData] = useState([])
  const [windowSize, setWindowSize] = useState(4) // heures
  const [stride, setStride] = useState(2) // heures
  const [currentWindow, setCurrentWindow] = useState(0)
  const [showOverlap, setShowOverlap] = useState(false)
  
  useEffect(() => {
    setData(generateActigraphyData(24))
  }, [])

  const pointsPerHour = 12
  const windowStart = currentWindow * stride * pointsPerHour
  const windowEnd = windowStart + (windowSize * pointsPerHour)
  const nextWindowStart = (currentWindow + 1) * stride * pointsPerHour

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Fenêtres d&apos;Analyse</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Concept de Fenêtrage</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Le fenêtrage est une technique utilisée pour diviser les longues séquences de données 
            d&apos;actigraphie en segments plus petits et gérables. Cela nous permet d&apos;extraire des 
            caractéristiques pertinentes et de préparer les données pour l&apos;apprentissage automatique.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paramètres de la Fenêtre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="window-size">Taille de la Fenêtre : {windowSize}h</Label>
            <Slider
              id="window-size"
              value={[windowSize]}
              onValueChange={(value) => setWindowSize(value[0])}
              min={1}
              max={8}
              step={1}
            />
          </div>
          <div>
            <Label htmlFor="stride">Stride (pas) : {stride}h</Label>
            <Slider
              id="stride"
              value={[stride]}
              onValueChange={(value) => setStride(value[0])}
              min={1}
              max={4}
              step={1}
            />
          </div>
          <div>
            <Label htmlFor="window-position">Position de la Fenêtre</Label>
            <Slider
              id="window-position"
              value={[currentWindow]}
              onValueChange={(value) => setCurrentWindow(value[0])}
              min={0}
              max={Math.floor((24 - windowSize) / stride)}
              step={1}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-overlap"
              checked={showOverlap}
              onCheckedChange={setShowOverlap}
            />
            <Label htmlFor="show-overlap">Afficher le chevauchement</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visualisation des Fenêtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  interval={30}
                  label={{ value: 'Heure de la journée', position: 'bottom', offset: 40  }}
                />
                <YAxis label={{ value: 'Valeurs', angle: -90, position: 'insideLeft'}} />
                <Tooltip />
                <Legend />
                <ReferenceArea 
                  x1={data[windowStart]?.timestamp} 
                  x2={data[windowEnd]?.timestamp}
                  fill="#82ca9d"
                  fillOpacity={0.2}
                  stroke="#82ca9d"
                  strokeOpacity={0.8}
                  strokeWidth={2}
                />
                {showOverlap && (
                  <ReferenceArea 
                    x1={data[nextWindowStart]?.timestamp} 
                    x2={data[windowEnd]?.timestamp}
                    fill="#8884d8"
                    fillOpacity={0.2}
                    stroke="#8884d8"
                    strokeOpacity={0.8}
                    strokeWidth={2}
                  />
                )}
                <Line type="monotone" dataKey="enmo" stroke="#ff7300" name="ENMO" dot={false} />
                <Line type="monotone" dataKey="anglez" stroke="#ff0000" name="angleZ" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importance du Fenêtrage</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Permet de capturer des motifs d&apos;activité sur des périodes spécifiques</li>
            <li>Facilite la comparaison entre différents participants ou périodes</li>
            <li>Aide à gérer la grande quantité de données collectées sur 30 jours</li>
            <li>Permet d&apos;extraire des caractéristiques pertinentes pour l&apos;apprentissage automatique</li>
            <li>Le chevauchement des fenêtres permet de ne pas manquer d&apos;informations importantes entre les fenêtres</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

