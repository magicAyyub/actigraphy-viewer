"use client"

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ActivityData {
  time: string;
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

            data.push({
              time: timeString,
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

      <Card>
        <CardHeader>
          <CardTitle>Visualisation d&apos;une Journée Type</CardTitle>
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
                            {payload && payload[0] && payload[0].value !== undefined && <p>{`Activité: ${(payload[0].value as number).toFixed(2)}`}</p>}
                          </div>
                        );
                      }
                      return null;
                    }}/>
                    <Legend />
                    <Line type="monotone" dataKey="activite" stroke="#8884d8" name="Activité Globale" />
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
                    <Line type="monotone" dataKey="X" stroke="#8884d8" name="X (gauche-droite)" />
                    <Line type="monotone" dataKey="Y" stroke="#82ca9d" name="Y (avant-arrière)" />
                    <Line type="monotone" dataKey="Z" stroke="#ffc658" name="Z (haut-bas)" />
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
                    <Line type="monotone" dataKey="enmo" stroke="#ff7300" name="ENMO" />
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
                    <Line type="monotone" dataKey="anglez" stroke="#ff0000" name="Angle Z" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interprétation des Données</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Les pics d&apos;activité correspondent généralement aux périodes de mouvement intense (ex: sport, jeux).</li>
            <li>Les périodes de faible activité peuvent indiquer le sommeil ou des activités sédentaires (ex: utilisation d&apos;Internet).</li>
            <li>L&apos;ENMO (Euclidean Norm Minus One) est une mesure globale de l&apos;intensité du mouvement.</li>
            <li>L&apos;angle Z donne des informations sur la position du bras par rapport à l&apos;horizontale.</li>
            <li>Les variations dans les axes X, Y, et Z nous donnent des informations détaillées sur le type de mouvement.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}