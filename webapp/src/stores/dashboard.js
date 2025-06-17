import { defineStore } from 'pinia'
import { computed } from 'vue'
import { usePatientsStore } from './patients'
import { useDoctorsStore } from './doctors'
import { useAppointmentsStore } from './appointments'

export const useDashboardStore = defineStore('dashboard', () => {
  // Computed properties che derivano i dati dagli altri store
  const dashboardData = computed(() => {
    const patientsStore = usePatientsStore()
    const doctorsStore = useDoctorsStore()
    const appointmentsStore = useAppointmentsStore()

    const today = new Date().toISOString().split('T')[0]

    // Calcola statistiche derivate
    const todayAppointments = appointmentsStore.allAppointments.filter(apt =>
      apt.appointment_date?.startsWith(today)
    )

    const pendingAppointments = appointmentsStore.allAppointments.filter(apt =>
      apt.status === 'pending'
    )

    // Prendi i pazienti più recenti (ordinati per data di creazione)
    const recentPatients = [...patientsStore.allPatients]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5)

    // Prendi gli appuntamenti più recenti
    const recentAppointments = [...appointmentsStore.allAppointments]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5)

    // Statistiche aggiuntive
    const appointmentsByStatus = appointmentsStore.allAppointments.reduce((acc, apt) => {
      const status = apt.status || 'pending'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    const doctorsBySpecialization = doctorsStore.allDoctors.reduce((acc, doctor) => {
      const spec = doctor.specialization || 'Generale'
      acc[spec] = (acc[spec] || 0) + 1
      return acc
    }, {})

    // Calcola appuntamenti per il mese corrente
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthlyAppointments = appointmentsStore.allAppointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date)
      return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear
    })

    return {
      totalPatients: patientsStore.allPatients.length,
      totalDoctors: doctorsStore.allDoctors.length,
      todayAppointments: todayAppointments.length,
      pendingAppointments: pendingAppointments.length,
      recentPatients,
      recentAppointments,
      statistics: {
        appointmentsByStatus,
        doctorsBySpecialization,
        availableDoctors: doctorsStore.allDoctors.filter(d => d.is_available).length,
        totalAppointments: appointmentsStore.allAppointments.length,
        monthlyAppointments: monthlyAppointments.length,
        completedAppointments: appointmentsStore.allAppointments.filter(apt => apt.status === 'completed').length,
        cancelledAppointments: appointmentsStore.allAppointments.filter(apt => apt.status === 'cancelled').length
      }
    }
  })

  // Computed per statistiche specifiche che potrebbero essere utili
  const quickStats = computed(() => {
    const data = dashboardData.value
    return {
      patientsGrowth: '+0%', // Potrai implementare la crescita quando avrai dati storici
      appointmentsToday: data.todayAppointments,
      pendingCount: data.pendingAppointments,
      availableDoctorsCount: data.statistics.availableDoctors
    }
  })

  const chartData = computed(() => {
    const data = dashboardData.value
    return {
      appointmentsByStatus: data.statistics.appointmentsByStatus,
      doctorsBySpecialization: data.statistics.doctorsBySpecialization
    }
  })

  return {
    // Getters computati
    dashboardData,
    quickStats,
    chartData
  }
})
