<template>
  <div class="availability-view">
    <div v-if="doctor" class="doctor-info">
      <h4>{{ doctor.name }}</h4>
      <p class="specialization">
        {{ doctor.specialization }}
      </p>
    </div>

    <div class="availability-schedule">
      <div
        v-for="day in daysOfWeek"
        :key="day.value"
        class="schedule-day"
        :class="{ 'day-available': isDayAvailable(day.value), 'day-unavailable': !isDayAvailable(day.value) }"
      >
        <div class="day-name">
          {{ day.label }}
        </div>
        <div class="day-hours">
          <template v-if="isDayAvailable(day.value)">
            <i class="pi pi-check-circle availability-icon available" />
            <span class="hours-text">{{ getDayHours(day.value) }}</span>
          </template>
          <template v-else>
            <i class="pi pi-times-circle availability-icon unavailable" />
            <span class="hours-text">Non disponibile</span>
          </template>
        </div>
      </div>
    </div>

    <div class="availability-summary">
      <div class="summary-item">
        <i class="pi pi-calendar" />
        <span>Giorni disponibili: {{ availableDaysCount }}/7</span>
      </div>
      <div class="summary-item">
        <i class="pi pi-clock" />
        <span>Ore settimanali: {{ totalWeeklyHours }}h</span>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'AvailabilityView',
  props: {
    doctor: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const daysOfWeek = [
      { value: 'monday', label: 'Lunedì' },
      { value: 'tuesday', label: 'Martedì' },
      { value: 'wednesday', label: 'Mercoledì' },
      { value: 'thursday', label: 'Giovedì' },
      { value: 'friday', label: 'Venerdì' },
      { value: 'saturday', label: 'Sabato' },
      { value: 'sunday', label: 'Domenica' }
    ]

    const parseAvailability = () => {
      if (!props.doctor?.availability) return {}

      try {
        if (typeof props.doctor.availability === 'string') {
          return JSON.parse(props.doctor.availability)
        }
        return props.doctor.availability
      } catch (error) {
        console.error('Error parsing availability:', error)
        return {}
      }
    }

    const availability = computed(() => parseAvailability())

    const isDayAvailable = (day) => {
      return availability.value[day] && availability.value[day] !== ''
    }

    const getDayHours = (day) => {
      const dayAvailability = availability.value[day]
      if (!dayAvailability) return ''

      if (typeof dayAvailability === 'string') {
        // Format: "09:00-17:00"
        return dayAvailability.replace('-', ' - ')
      }

      if (dayAvailability.start && dayAvailability.end) {
        return `${dayAvailability.start} - ${dayAvailability.end}`
      }

      return ''
    }

    const calculateHours = (timeRange) => {
      if (!timeRange) return 0

      try {
        const [start, end] = timeRange.split('-')
        const [startHour, startMin] = start.split(':').map(Number)
        const [endHour, endMin] = end.split(':').map(Number)

        const startTotalMin = startHour * 60 + startMin
        const endTotalMin = endHour * 60 + endMin

        return (endTotalMin - startTotalMin) / 60
      } catch (error) {
        console.error('Error calculating hours:', error)
        return 0
      }
    }

    const availableDaysCount = computed(() => {
      return daysOfWeek.filter(day => isDayAvailable(day.value)).length
    })

    const totalWeeklyHours = computed(() => {
      let total = 0
      daysOfWeek.forEach(day => {
        if (isDayAvailable(day.value)) {
          const dayAvailability = availability.value[day.value]
          if (typeof dayAvailability === 'string') {
            total += calculateHours(dayAvailability)
          }
        }
      })
      return Math.round(total * 10) / 10 // Round to 1 decimal place
    })

    return {
      daysOfWeek,
      isDayAvailable,
      getDayHours,
      availableDaysCount,
      totalWeeklyHours
    }
  }
})
</script>

<style scoped>
.availability-view {
  padding: 1rem 0;
}

.doctor-info {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-200);
}

.doctor-info h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
  font-size: 1.25rem;
}

.specialization {
  color: var(--text-color-secondary);
  font-style: italic;
  margin: 0;
}

.availability-schedule {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.schedule-day {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid var(--surface-200);
}

.day-available {
  background-color: var(--primary-50);
  border-color: var(--primary-200);
}

.day-unavailable {
  background-color: var(--surface-100);
  border-color: var(--surface-200);
}

.day-name {
  font-weight: 600;
  color: var(--text-color);
  min-width: 80px;
}

.day-hours {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.availability-icon {
  font-size: 1rem;
}

.availability-icon.available {
  color: var(--primary-600);
}

.availability-icon.unavailable {
  color: var(--surface-400);
}

.hours-text {
  font-family: monospace;
  font-weight: 500;
  color: var(--text-color-secondary);
}

.day-available .hours-text {
  color: var(--primary-700);
}

.availability-summary {
  display: flex;
  gap: 1.5rem;
  padding: 1rem;
  background-color: var(--surface-50);
  border-radius: 6px;
  border: 1px solid var(--surface-200);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.summary-item i {
  color: var(--primary-600);
}

/* Responsive design */
@media (max-width: 768px) {
  .availability-summary {
    flex-direction: column;
    gap: 0.75rem;
  }

  .schedule-day {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .day-hours {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
