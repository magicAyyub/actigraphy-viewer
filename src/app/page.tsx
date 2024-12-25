"use client"

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface ActivityData {
  time: string;
  timeValue: number;
  activite: number;
  X: number;
  Y: number;
  Z: number;
  enmo: number;
  anglez: number;
  activity_name: string;
}

interface Activity {
  name: string;
  intensity: number;
  duration: number;
}

export default function Actigraphie() {
  const [data, setData] = useState<ActivityData[]>([])
  const [windowSize, setWindowSize] = useState(4)
  const [stride, setStride] = useState(2)
  const [currentWindow, setCurrentWindow] = useState(0)
  const [showOverlap, setShowOverlap] = useState(false)

  useEffect(() => {
    const generateDailyPattern = (startHour: number): ActivityData[] => {
      const data: ActivityData[] = [];
      const activities: Activity[] = [
        { name: 'Sommeil', intensity: 0.1, duration: 7 },
        { name: 'Réveil/Préparation', intensity: 0.6, duration: 1 },
        { name: 'Transport/École', intensity: 0.4, duration: 2 },
        { name: 'Activités/Cours', intensity: 0.5, duration: 6 },
        { name: 'Déjeuner/Pause', intensity: 0.7, duration: 2 },
        { name: 'Activités/Cours', intensity: 0.5, duration: 4 },
        { name: 'Activités du soir', intensity: 0.6, duration: 2 }
      ];

      let currentHour = startHour;
      activities.forEach(activity => {
        for (let h = 0; h < activity.duration; h++) {
          for (let m = 0; m < 60; m += 5) {
            const timeString = `${String(currentHour % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const baseIntensity = activity.intensity;
            const timeValue = currentHour + m/60;

            data.push({
              time: timeString,
              timeValue: timeValue,
              activite: baseIntensity + Math.sin(m / 30) * 0.2 * baseIntensity + Math.random() * 0.1,
              X: (Math.sin(m / 15) * 0.3 + Math.random() * 0.2) * baseIntensity,
              Y: (Math.cos(m / 20) * 0.3 + Math.random() * 0.2) * baseIntensity,
              Z: (Math.sin(m / 25) * 0.3 + Math.random() * 0.2) * baseIntensity,
              enmo: baseIntensity + Math.random() * 0.2,
              anglez: 45 * Math.sin((currentHour + m / 60) * Math.PI / 12),
              activity_name: activity.name
            });
          }
          currentHour++;
        }
      });
      return data;
    };

    setData(generateDailyPattern(0));
  }, []);

  const pointsPerHour = 12;
  const windowStart = currentWindow * stride * pointsPerHour;
  const windowEnd = windowStart + (windowSize * pointsPerHour);
  const nextWindowStart = (currentWindow + 1) * stride * pointsPerHour;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Comprendre l&apos;Actigraphie</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Qu&apos;est-ce que l&apos;Actigraphie ?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            L&apos;actigraphie est comme un &quot;journal de bord automatique&quot; des mouvements. 
            Imaginez un petit capteur porté au poignet qui enregistre chaque 
            mouvement, comme une montre qui note tous vos gestes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Mouvements en 3D</h3>
              <p>Comme dans un jeu vidéo, le capteur mesure les mouvements dans trois directions :</p>
              <ul className="list-disc ml-4 mt-2">
                <li className="text-blue-700">X : gauche-droite</li>
                <li className="text-green-700">Y : avant-arrière</li>
                <li className="text-purple-700">Z : haut-bas</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Fréquence</h3>
              <p>Le capteur prend des mesures toutes les 5 secondes, soit :</p>
              <ul className="list-disc ml-4 mt-2">
                <li>12 mesures par minute</li>
                <li>720 mesures par heure</li>
                <li>17 280 mesures par jour</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Durée</h3>
              <p>Les participants portent le capteur pendant :</p>
              <ul className="list-disc ml-4 mt-2">
                <li>Jusqu&apos;à 30 jours consécutifs</li>
                <li>Jour et nuit</li>
                <li>Durant toutes leurs activités</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Window Parameters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de la Fenêtre d&apos;Analyse</CardTitle>
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

      {/* Visualization Card */}
      <Card>
        <CardHeader>
          <CardTitle>Visualisation des Données</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="activite">
            <TabsList>
              <TabsTrigger value="activite">Activité Globale</TabsTrigger>
              <TabsTrigger value="axes">Axes X, Y, Z</TabsTrigger>
              <TabsTrigger value="enmo">ENMO</TabsTrigger>
              <TabsTrigger value="anglez">Angle Z</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activite">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      interval={60}
                      label={{ value: 'Heure de la journée', position: 'bottom', offset: 40 }}
                    />
                    <YAxis label={{ value: 'Intensité du mouvement', angle: -90, position: 'insideLeft' }} />
                    <Tooltip content={({ payload, label }) => {
                      if (payload && payload.length) {
                        return (
                          <div className="bg-white p-2 border">
                            <p>{`${label} - ${payload[0].payload.activity_name}`}</p>
                            <p>{`Activité: ${typeof payload[0].value === 'number' ? payload[0].value.toFixed(2) : payload[0].value}`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}/>
                    <Legend />
                    <Line type="monotone" dataKey="activite" stroke="#8884d8" name="Activité Globale" dot={false} />
                    <ReferenceArea 
                      x1={data[windowStart]?.time} 
                      x2={data[windowEnd]?.time}
                      fill="#82ca9d"
                      fillOpacity={0.2}
                      stroke="#82ca9d"
                      strokeOpacity={0.8}
                      strokeWidth={2}
                    />
                    {showOverlap && (
                      <ReferenceArea 
                        x1={data[nextWindowStart]?.time} 
                        x2={data[windowEnd]?.time}
                        fill="#8884d8"
                        fillOpacity={0.2}
                        stroke="#8884d8"
                        strokeOpacity={0.8}
                        strokeWidth={2}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="axes">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      interval={60}
                      label={{ value: 'Heure de la journée', position: 'bottom', offset: 40 }}
                    />
                    <YAxis label={{ value: 'Accélération (g)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="X" stroke="#8884d8" name="X (gauche-droite)" dot={false} />
                    <Line type="monotone" dataKey="Y" stroke="#82ca9d" name="Y (avant-arrière)" dot={false} />
                    <Line type="monotone" dataKey="Z" stroke="#ffc658" name="Z (haut-bas)" dot={false} />
                    <ReferenceArea 
                      x1={data[windowStart]?.time} 
                      x2={data[windowEnd]?.time}
                      fill="#82ca9d"
                      fillOpacity={0.2}
                      stroke="#82ca9d"
                      strokeOpacity={0.8}
                      strokeWidth={2}
                    />
                    {showOverlap && (
                      <ReferenceArea 
                        x1={data[nextWindowStart]?.time} 
                        x2={data[windowEnd]?.time}
                        fill="#8884d8"
                        fillOpacity={0.2}
                        stroke="#8884d8"
                        strokeOpacity={0.8}
                        strokeWidth={2}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="enmo">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      interval={60}
                      label={{ value: 'Heure de la journée', position: 'bottom', offset: 40 }}
                    />
                    <YAxis label={{ value: 'ENMO', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="enmo" stroke="#ff7300" name="ENMO" dot={false} />
                    <ReferenceArea 
                      x1={data[windowStart]?.time} 
                      x2={data[windowEnd]?.time}
                      fill="#82ca9d"
                      fillOpacity={0.2}
                      stroke="#82ca9d"
                      strokeOpacity={0.8}
                      strokeWidth={2}
                    />
                    {showOverlap && (
                      <ReferenceArea 
                        x1={data[nextWindowStart]?.time} 
                        x2={data[windowEnd]?.time}
                        fill="#8884d8"
                        fillOpacity={0.2}
                        stroke="#8884d8"
                        strokeOpacity={0.8}
                        strokeWidth={2}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="anglez">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      interval={60}
                      label={{ value: 'Heure de la journée', position: 'bottom', offset: 40 }}
                    />
                    <YAxis label={{ value: 'Angle Z (degrés)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="anglez" stroke="#ff0000" name="Angle Z" dot={false} />
                    <ReferenceArea 
                      x1={data[windowStart]?.time} 
                      x2={data[windowEnd]?.time}
                      fill="#82ca9d"
                      fillOpacity={0.2}
                      stroke="#82ca9d"
                      strokeOpacity={0.8}
                      strokeWidth={2}
                    />
                    {showOverlap && (
                      <ReferenceArea 
                        x1={data[nextWindowStart]?.time} 
                        x2={data[windowEnd]?.time}
                        fill="#8884d8"
                        fillOpacity={0.2}
                        stroke="#8884d8"
                        strokeOpacity={0.8}
                        strokeWidth={2}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Interpretation Card */}
      <Card>
        <CardHeader>
          <CardTitle>Interprétation des Données</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Les pics d&apos;activité correspondent généralement aux périodes de mouvement intense (ex: sport, jeux).</li>
            <li>Les périodes de faible activité peuvent indiquer le sommeil ou des activités sédentaires.</li>
            <li>L&apos;ENMO est une mesure globale de l&apos;intensité du mouvement.</li>
            <li>L&apos;angle Z donne des informations sur la position du bras par rapport à l&apos;horizontale.</li>
            <li>Le fenêtrage permet d&apos;analyser des périodes spécifiques et de comparer différents moments de la journée.</li>
          </ul>
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