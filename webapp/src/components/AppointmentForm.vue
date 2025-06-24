<template>
  <div class="appointment-form">
    <form @submit.prevent="handleSubmit">
      <div class="form-grid">
        <!-- Sezione Informazioni Paziente -->
        <div class="patient-section form-field-full">
          <h4>Informazioni Paziente</h4>
          <div class="form-grid">
            <!-- Informazioni Paziente -->
            <div class="form-field">
              <label class="field-label">Paziente Registrato</label>
              <div class="patient-field-container">
                <Select id="patient" v-model="formData.patient_id" :options="patientOptions" option-label="label"
                  option-value="value" :disabled="mode === 'view'" :class="{ 'p-invalid': errors.patient_id }"
                  placeholder="Seleziona paziente registrato" :filter="true" filter-placeholder="Cerca paziente..."
                  class="patient-select" />
                <Button v-if="formData.patient_id && mode !== 'view'" icon="pi pi-times"
                  class="p-button-text p-button-sm reset-patient-btn" @click="resetPatientSelection"
                  title="Deseleziona paziente" />
              </div>
              <small class="field-help">Opzionale - se il paziente non è in archivio, compila i campi seguenti</small>
            </div>

            <div class="form-field">
              <label class="field-label">Nome Completo *</label>
              <InputText id="patient_full_name" v-model="formData.patient_full_name" :disabled="mode === 'view'"
                :class="{ 'p-invalid': errors.patient_full_name }" placeholder="Nome e cognome del paziente" />
              <small v-if="errors.patient_full_name" class="p-error">{{ errors.patient_full_name }}</small>
            </div>

            <div class="form-field">
              <label class="field-label">Email</label>
              <InputText id="patient_email" v-model="formData.patient_email" :disabled="mode === 'view'"
                :class="{ 'p-invalid': errors.patient_email }" placeholder="email@example.com" type="email" />
              <small v-if="errors.patient_email" class="p-error">{{ errors.patient_email }}</small>
            </div>

            <div class="form-field">
              <label class="field-label">Codice Fiscale</label>
              <InputText id="patient_codice_fiscale" v-model="formData.patient_codice_fiscale"
                :disabled="mode === 'view'" :class="{ 'p-invalid': errors.patient_codice_fiscale }"
                placeholder="RSSMRA85M01H501Z" style="text-transform: uppercase" maxlength="16" />
              <small v-if="errors.patient_codice_fiscale" class="p-error">{{ errors.patient_codice_fiscale }}</small>
            </div>

            <div class="form-field">
              <label class="field-label">Telefono</label>
              <InputText id="patient_phone" v-model="formData.patient_phone" :disabled="mode === 'view'"
                :class="{ 'p-invalid': errors.patient_phone }" placeholder="+39 333 1234567" />
              <small v-if="errors.patient_phone" class="p-error">{{ errors.patient_phone }}</small>
            </div>
          </div>
        </div>
        <!-- Sezione Appuntamento -->
        <div class="appointment-section form-field-full">
          <h4>Dettagli Appuntamento</h4>
          <div class="form-grid">
            <div class="form-field">
              <label class="field-label">Medico *</label>
              <Select id="doctor" v-model="formData.doctor_id" :options="doctorOptions" option-label="label"
                option-value="value" :disabled="mode === 'view'" :class="{ 'p-invalid': errors.doctor_id }"
                placeholder="Seleziona medico" :filter="true" filter-placeholder="Cerca medico..." />
              <small v-if="errors.doctor_id" class="p-error">{{ errors.doctor_id }}</small>
              <small v-if="formData.service_id && filteredDoctors.length === 0" class="field-help">
                Nessun medico disponibile per questo servizio
              </small>
            </div>
            <div class="form-field">
              <label class="field-label">Prestazione *</label>
              <div v-if="mode === 'view' && appointment?.service_name" class="service-display">
                <InputText id="service_name"
                  :value="`${appointment.service_name} - ${appointment.duration_minutes || 30}min - €${appointment.price || '0.00'}`"
                  disabled />
                <small v-if="appointment.service_description" class="field-help">{{ appointment.service_description
                }}</small>
              </div>
              <div v-else class="service-field-container">
                <Select id="service" v-model="formData.service_id" :options="serviceOptions" option-label="label"
                  option-value="value" :disabled="mode === 'view'" :class="{ 'p-invalid': errors.service_id }"
                  placeholder="Seleziona prestazione" :filter="true" filter-placeholder="Cerca prestazione..."
                  class="service-select" />
                <Button v-if="(formData.doctor_id || formData.service_id) && mode !== 'view'" icon="pi pi-times"
                  class="p-button-text p-button-sm reset-filter-btn"
                  @click="resetFilters(); formData.doctor_id = null; formData.service_id = null"
                  title="Resetta filtri" />
              </div>
              <small v-if="errors.service_id" class="p-error">{{ errors.service_id }}</small>
              <small v-if="formData.doctor_id && filteredServices.length === 0" class="field-help">
                Nessun servizio disponibile per questo medico
              </small>
              <small v-if="!formData.doctor_id && !formData.service_id && mode !== 'view'" class="field-help">
                Seleziona un medico per vedere i suoi servizi, o un servizio per vedere i medici disponibili
              </small>
            </div>

            <div class="form-field">
              <label class="field-label">Data *</label>
              <DatePicker id="appointment_date" v-model="formData.appointment_date" :disabled="mode === 'view'"
                :class="{ 'p-invalid': errors.appointment_date }" date-format="dd/mm/yy" :show-icon="true"
                placeholder="Seleziona data" :min-date="new Date()" />
              <small v-if="errors.appointment_date" class="p-error">{{ errors.appointment_date }}</small>
            </div>

            <div class="form-field">
              <label class="field-label">Orario *</label>
              <Select v-if="mode !== 'view'" id="appointment_time" v-model="formData.appointment_time"
                :options="availableTimeSlots" option-label="label" option-value="value"
                :class="{ 'p-invalid': errors.appointment_time }"
                :disabled="!formData.appointment_date || !formData.doctor_id || loadingSlots" :loading="loadingSlots"
                placeholder="Seleziona prima data e medico" />
              <InputText v-else id="appointment_time_display" :value="formatTimeForDisplay(formData.appointment_time)"
                :disabled="true" class="time-display-field" />
              <small v-if="errors.appointment_time" class="p-error">{{ errors.appointment_time }}</small>
              <small
                v-if="mode !== 'view' && formData.appointment_date && formData.doctor_id && availableTimeSlots.length === 0 && !loadingSlots"
                class="field-help">
                Nessun slot disponibile per questa data
              </small>
              <small v-if="mode !== 'view' && (!formData.appointment_date || !formData.doctor_id)" class="field-help">
                Seleziona prima una data e un medico per vedere gli orari disponibili
              </small>
            </div>

            <div class="form-field">
              <label class="field-label">Stato</label>
              <Select id="status" v-model="formData.status" :options="statusOptions" option-label="label"
                option-value="value" :disabled="mode === 'view'" placeholder="Seleziona stato" />
            </div>

            <div class="form-field form-field-full">
              <label class="field-label">Note</label>
              <Textarea id="notes" v-model="formData.notes" :disabled="mode === 'view'" rows="4"
                placeholder="Note sull'appuntamento..." />
            </div>
          </div>
        </div>

        <!-- Sezione Campi Personalizzati -->
        <div class="custom-fields-section form-field-full">
          <div class="custom-fields-header">
            <h4>Campi Personalizzati</h4>
            <Button v-if="mode !== 'view'" label="Aggiungi Campo" icon="pi pi-plus"
              class="p-button-sm p-button-outlined" @click="addCustomField" />
          </div>

          <div v-if="formData.customFields && formData.customFields.length > 0" class="custom-fields-list">
            <div v-for="(field, index) in formData.customFields" :key="`custom-field-${index}`"
              class="custom-field-item">
              <div class="custom-field-controls">
                <div class="form-field">
                  <label class="field-label">Titolo Campo</label>
                  <InputText v-model="field.title" :disabled="mode === 'view'"
                    placeholder="Es: Allergie, Note speciali, Anamnesi..." />
                </div>

                <div v-if="mode !== 'view'" class="field-actions">
                  <Button icon="pi pi-trash" class="p-button-danger p-button-text p-button-sm"
                    @click="removeCustomField(index)" title="Rimuovi campo" />
                </div>
              </div>

              <div class="custom-field-value">
                <label class="field-label">{{ field.title || 'Contenuto' }}</label>
                <Textarea v-model="field.value" :disabled="mode === 'view'" rows="4"
                  :placeholder="`Inserisci ${field.title || 'contenuto'}...`" />
              </div>
            </div>
          </div>

          <div v-else class="empty-custom-fields">
            <p v-if="mode === 'view'">Nessun campo personalizzato presente per questo appuntamento.</p>
            <p v-else>Nessun campo personalizzato aggiunto. Clicca "Aggiungi Campo" per iniziare.</p>
          </div>
        </div>

        <!-- Codice appuntamento (solo in visualizzazione) -->
        <div v-if="mode === 'view' && appointment?.code" class="form-field">
          <label class="field-label">Codice Alive</label>
          <InputText id="appointment_code" :value="appointment.code" disabled class="code-field" />
        </div>
      </div>

      <!-- Appointment Details (if viewing) -->
      <div v-if="mode === 'view' && appointment" class="appointment-details">
        <Divider />
        <h4>Dettagli Appuntamento</h4>
        <div class="details-grid">
          <div class="detail-item">
            <label>ID Appuntamento:</label>
            <span>#{{ appointment.id }}</span>
          </div>
          <div class="detail-item">
            <label>Creato il:</label>
            <span>{{ formatDateTime(appointment.created_at) }}</span>
          </div>
          <div v-if="appointment.updated_at !== appointment.created_at" class="detail-item">
            <label>Ultima modifica:</label>
            <span>{{ formatDateTime(appointment.updated_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="form-actions">
        <Button label="Annulla" icon="pi pi-times" class="p-button-text" type="button" @click="$emit('cancel')" />

        <div class="action-buttons-right">
          <Button v-if="mode === 'view'" label="Modifica" icon="pi pi-pencil" type="button" @click="switchToEditMode" />
          <Button v-if="mode === 'view' && appointment" label="Elimina" icon="pi pi-trash" class="p-button-danger"
            type="button" @click="confirmDelete" />
          <Button v-if="mode !== 'view'" :label="mode === 'create' ? 'Crea Appuntamento' : 'Salva Modifiche'"
            :icon="mode === 'create' ? 'pi pi-plus' : 'pi pi-check'" type="submit" :loading="loading" />
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import { useServicesStore } from '../stores/services'
import { useDoctorsStore } from '../stores/doctors'
import { usePatientsStore } from '../stores/patients'
import { useFormData } from '../composables/useFormData'
import api from '../services/api'

export default defineComponent({
  name: 'AppointmentForm',
  components: {
    Select,
    DatePicker,
    Textarea,
    InputText,
    Button,
    Divider
  },
  props: {
    appointment: {
      type: Object,
      default: null
    },
    mode: {
      type: String,
      default: 'view',
      validator: (value) => ['view', 'edit', 'create'].includes(value)
    },
    preselectedDate: {
      type: String,
      default: null
    },
    preselectedHour: {
      type: Number,
      default: null
    }
  },
  emits: ['save', 'cancel', 'delete', 'switch-mode'], setup(props, { emit }) {
    const confirm = useConfirm()
    const servicesStore = useServicesStore()
    const doctorsStore = useDoctorsStore()
    const patientsStore = usePatientsStore()    // Utilizziamo il composable per gestire i dati del form
    const {
      doctors: allDoctors,
      patients: allPatients,
      services: allServices,
      ensureDataLoaded,
      isCriticalDataAvailable
    } = useFormData()

    const loading = ref(false)
    const errors = ref({})

    const statusOptions = [
      { label: 'Programmato', value: 'scheduled' },
      { label: 'Confermato', value: 'confirmed' },
      { label: 'Annullato', value: 'cancelled' },
      { label: 'Completato', value: 'completed' }
    ]

    const formData = ref({
      patient_id: null,
      patient_full_name: '',
      patient_email: '',
      patient_codice_fiscale: '',
      patient_phone: '',
      doctor_id: null,
      service_id: null,
      appointment_date: null,
      appointment_time: null,
      status: 'scheduled',
      notes: '',
      customFields: []
    })

    // Inizializza formData immediatamente se non c'è un appuntamento
    if (!props.appointment) {
      const now = new Date()
      let appointmentDate = now
      let appointmentTime = null

      // Handle preselected date and hour
      if (props.preselectedDate) {
        appointmentDate = new Date(props.preselectedDate)
      } if (props.preselectedHour !== null) {
        const hours = Math.floor(props.preselectedHour)
        const minutes = Math.round((props.preselectedHour - hours) * 60)
        appointmentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

        if (props.preselectedDate) {
          appointmentDate.setHours(hours, minutes, 0, 0)
        }
      }

      formData.value = {
        patient_id: null,
        patient_full_name: '',
        patient_email: '',
        patient_codice_fiscale: '',
        patient_phone: '',
        doctor_id: null,
        service_id: null,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        status: 'scheduled',
        notes: '',
        customFields: []
      }
    }

    // State per i dati filtrati
    const loadingData = ref(false)

    // State per i dati filtrati
    const filteredServices = ref([])
    const filteredDoctors = ref([])

    // State per la gestione degli slot disponibili
    const selectedDoctor = ref(null)
    const doctorAvailability = ref(null)
    const bookedSlots = ref([])
    const loadingSlots = ref(false)
    const availableTimeSlots = ref([])

    // Garantiamo che i dati siano caricati
    const ensureFormDataIsReady = async () => {
      loadingData.value = true
      try {
        console.log('🔄 Ensuring form data is loaded...')
        const result = await ensureDataLoaded()

        if (!isCriticalDataAvailable.value) {
          console.warn('⚠️ Critical form data is not available')
        } else {
          console.log('✅ Form data is ready:', {
            doctors: allDoctors.value.length,
            patients: allPatients.value.length,
            services: allServices.value.length
          })
        }

        // Inizializza i filtri dopo che i dati sono stati caricati
        initializeFilters()

        return result
      } catch (error) {
        console.error('❌ Error ensuring form data loaded:', error)
        return false
      } finally {
        loadingData.value = false
      }
    }

    // Inizializza i filtri con i dati degli store
    const initializeFilters = () => {
      filteredServices.value = [...allServices.value]
      filteredDoctors.value = [...allDoctors.value]

      console.log('🔄 Filters initialized:')
      console.log('- Services:', filteredServices.value.length)
      console.log('- Doctors:', filteredDoctors.value.length)
      console.log('- Patients:', allPatients.value.length)
    }

    // Initialize component
    onMounted(async () => {
      await ensureFormDataIsReady()

      // Se abbiamo già un appuntamento, inizializza i filtri appropriati
      if (props.appointment) {
        initializeFiltersForAppointment(props.appointment)
      }
    })

    // Computed per le opzioni dei dropdown
    const patientOptions = computed(() =>
      allPatients.value.map(patient => ({
        label: `${patient.name} - ${patient.email}`,
        value: patient.id
      }))
    )

    const serviceOptions = computed(() =>
      filteredServices.value.map(service => ({
        label: `${service.name} - ${service.duration_minutes}min - €${service.price}`,
        value: service.id
      }))
    )

    const doctorOptions = computed(() =>
      filteredDoctors.value.map(doctor => ({
        label: `${doctor.name} - ${doctor.specialization}`,
        value: doctor.id
      }))
    )    // Funzione per inizializzare i filtri per un appuntamento esistente
    const initializeFiltersForAppointment = (appointment) => {
      console.log('Initializing filters for appointment:', appointment)

      if (appointment.doctor_id && appointment.service_id) {
        // Se abbiamo sia dottore che servizio, non filtriamo
        filteredDoctors.value = [...allDoctors.value]
        filteredServices.value = [...allServices.value]
      } else if (appointment.doctor_id) {
        // Se abbiamo solo il dottore, filtra i servizi
        filterServicesByDoctor(appointment.doctor_id)
        loadDoctorAvailability(appointment.doctor_id)
      } else if (appointment.service_id) {
        // Se abbiamo solo il servizio, filtra i dottori
        filterDoctorsByService(appointment.service_id)
      }
    }

    // Funzioni per il filtraggio bidirezionale
    const filterServicesByDoctor = (doctorId) => {
      if (!doctorId) {
        // Se nessun dottore selezionato, mostra tutti i servizi
        filteredServices.value = [...allServices.value]
        return
      }

      // Filtra i servizi per il dottore selezionato
      filteredServices.value = allServices.value.filter(service =>
        service.doctor_id === doctorId
      )

      // Se il servizio attualmente selezionato non è disponibile per questo dottore, resettalo
      if (formData.value.service_id &&
        !filteredServices.value.some(service => service.id === formData.value.service_id)) {
        formData.value.service_id = null
      }
    }

    const filterDoctorsByService = (serviceId) => {
      if (!serviceId) {
        // Se nessun servizio selezionato, mostra tutti i dottori
        filteredDoctors.value = [...allDoctors.value]
        return
      }

      // Trova il servizio selezionato
      const selectedService = allServices.value.find(service => service.id === serviceId)
      if (!selectedService) {
        filteredDoctors.value = [...allDoctors.value]
        return
      }

      // Filtra i dottori che forniscono questo servizio
      const doctorIdsForService = allServices.value
        .filter(service => service.id === serviceId)
        .map(service => service.doctor_id)
      filteredDoctors.value = allDoctors.value.filter(doctor => doctorIdsForService.includes(doctor.id))

      // Se il dottore attualmente selezionato non fornisce questo servizio, resettalo
      if (formData.value.doctor_id &&
        !filteredDoctors.value.some(doctor => doctor.id === formData.value.doctor_id)) {
        formData.value.doctor_id = null
      }
    }

    // Funzioni per la gestione degli slot disponibili
    const loadDoctorAvailability = async (doctorId) => {
      if (!doctorId) {
        selectedDoctor.value = null
        doctorAvailability.value = null
        availableTimeSlots.value = []
        return
      }

      try {
        selectedDoctor.value = await doctorsStore.fetchDoctor(doctorId)
        if (selectedDoctor.value) {
          doctorAvailability.value = selectedDoctor.value.availability || {}
        }
      } catch (error) {
        console.error('Error loading doctor availability:', error)
        selectedDoctor.value = null
        doctorAvailability.value = null
      }
    }

    const loadBookedSlotsForDate = async (date, doctorId) => {
      if (!doctorId || !date) {
        bookedSlots.value = []
        return
      }

      loadingSlots.value = true
      try {        // Formatta la data per l'API (senza conversione di fuso orario)
        console.log('Original date:', date)
        const selectedDate = new Date(date)
        // Formato YYYY-MM-DD mantenendo il fuso orario locale
        const formattedDate = selectedDate.getFullYear() + '-' +
          (selectedDate.getMonth() + 1).toString().padStart(2, '0') + '-' +
          selectedDate.getDate().toString().padStart(2, '0')
        console.log('Loading busy slots for doctor:', doctorId, 'date:', formattedDate)
        const response = await api.get(`/appointments/doctor/${doctorId}/busy-slots?date=${formattedDate}`)
        console.log('Busy slots response:', response)

        // Reset bookedSlots per evitare duplicazioni
        bookedSlots.value = []

        for (const slot of response) {
          if (!slot.start_time || !slot.end_time) {
            console.warn('Invalid busy slot received:', slot)
            continue
          }

          // Converti le date in oggetti Date per il confronto
          const startTime = new Date(slot.start_time)
          const endTime = new Date(slot.end_time)

          // Genera tutte le mezz'ore tra start e end e aggiungile ai bookedSlots
          const current = new Date(startTime)
          while (current < endTime) {
            // Usa formato HH:MM per coerenza con generateAvailableTimeSlots
            const timeString = current.getHours().toString().padStart(2, '0') + ':' +
              current.getMinutes().toString().padStart(2, '0')
            bookedSlots.value.push(timeString)
            current.setMinutes(current.getMinutes() + 30)
          }
        }
        console.log("bookedSlots:", bookedSlots.value)
      } catch (error) {
        console.error('Error loading booked slots:', error)
        bookedSlots.value = []
      } finally {
        loadingSlots.value = false
      }
    }

    const generateAvailableTimeSlots = () => {
      console.log('Generating slots with bookedSlots:', bookedSlots.value)

      if (!formData.value.appointment_date || !doctorAvailability.value) {
        availableTimeSlots.value = []
        return
      }

      const selectedDate = new Date(formData.value.appointment_date)
      const dayIndex = selectedDate.getDay() // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const selectedDay = dayNames[dayIndex]
      const dayAvailability = doctorAvailability.value[selectedDay]

      if (!dayAvailability) {
        availableTimeSlots.value = []
        return
      }

      const slots = []
      const [startTime, endTime] = dayAvailability.split('-')
      const [startHour, startMinute] = startTime.split(':').map(Number)
      const [endHour, endMinute] = endTime.split(':').map(Number)

      // Genera tutti gli slot possibili per il giorno
      for (let hour = startHour; hour < endHour || (hour === endHour && startMinute < endMinute); hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          if (hour === endHour && minute >= endMinute) break
          if (hour === startHour && minute < startMinute) continue

          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

          // Controlla se questo slot è già prenotato
          // Ora bookedSlots contiene direttamente le stringhe di tempo (es. "14:30")
          const isBooked = bookedSlots.value.includes(timeString)

          if (isBooked) {
            console.log(`Slot ${timeString} is blocked (found in bookedSlots)`)
          }

          if (!isBooked) {
            slots.push({
              label: timeString,
              value: timeString
            })
          }
        }
      }

      console.log(`Generated ${slots.length} available slots for ${selectedDay}:`, slots.map(s => s.value))
      availableTimeSlots.value = slots
    }

    const getDayLabel = (dayKey) => {
      const dayLabels = {
        monday: 'Lunedì',
        tuesday: 'Martedì',
        wednesday: 'Mercoledì',
        thursday: 'Giovedì',
        friday: 'Venerdì',
        saturday: 'Sabato',
        sunday: 'Domenica'
      }
      return dayLabels[dayKey] || dayKey
    }

    // Watch per la selezione bidirezionale
    watch(() => formData.value.service_id, (newServiceId, oldServiceId) => {
      if (newServiceId !== oldServiceId) {
        filterDoctorsByService(newServiceId)
      }
    })

    // Watch per la gestione degli slot disponibili
    watch(() => formData.value.appointment_date, async (newDate) => {
      // Non resettare l'orario in modalità view
      if (props.mode !== 'view') {
        formData.value.appointment_time = null // Reset time when date changes
      }

      // Ricarica gli slot solo se non in modalità view e abbiamo doctor selezionato
      if (props.mode !== 'view' && newDate && formData.value.doctor_id) {
        console.log('Date changed, reloading slots for:', newDate, 'doctor:', formData.value.doctor_id)
        await loadBookedSlotsForDate(newDate, formData.value.doctor_id)
        generateAvailableTimeSlots()
      } else if (props.mode !== 'view') {
        availableTimeSlots.value = []
      }
    })

    // Watch per i cambi di dottore - ricarica gli slot se c'è anche una data
    watch(() => formData.value.doctor_id, async (newDoctorId, oldDoctorId) => {
      if (newDoctorId !== oldDoctorId) {
        // Applica sempre i filtri
        filterServicesByDoctor(newDoctorId)
        loadDoctorAvailability(newDoctorId) // Carica disponibilità dottore

        // Ricarica gli slot solo se non in modalità view
        if (props.mode !== 'view') {
          // Se c'è una data selezionata, ricarica gli slot
          if (formData.value.appointment_date && newDoctorId) {
            console.log('Doctor changed, reloading slots for:', formData.value.appointment_date, 'doctor:', newDoctorId)
            await loadBookedSlotsForDate(formData.value.appointment_date, newDoctorId)
            generateAvailableTimeSlots()
          } else {
            availableTimeSlots.value = []
          }

          // Reset time when doctor changes (solo se non in modalità view)
          formData.value.appointment_time = null
        }
      }
    })      // Watch per sincronizzare i dati paziente quando selezionato dall'archivio
    watch(() => formData.value.patient_id, (newPatientId) => {
      if (newPatientId) {
        const selectedPatient = allPatients.value.find(p => p.id === newPatientId)
        if (selectedPatient) {
          formData.value.patient_full_name = selectedPatient.name
          formData.value.patient_email = selectedPatient.email
          formData.value.patient_codice_fiscale = selectedPatient.fiscal_code || ''
          formData.value.patient_phone = selectedPatient.phone || ''
        }
      }
    })// Reset filters when both doctor and service are cleared
    const resetFilters = () => {
      filteredServices.value = [...allServices.value]
      filteredDoctors.value = [...allDoctors.value]
    }

    // Watch for allDoctors changes from store
    watch(allDoctors, (newDoctors) => {
      if (!formData.value.service_id) {
        filteredDoctors.value = [...newDoctors]
      } else {
        // Re-apply service filter with new doctors
        filterDoctorsByService(formData.value.service_id)
      }
    })

    // Watch for allServices changes from store
    watch(allServices, (newServices) => {
      if (!formData.value.doctor_id) {
        filteredServices.value = [...newServices]
      } else {
        // Re-apply doctor filter with new services
        filterServicesByDoctor(formData.value.doctor_id)
      }
    })
    // Watch for appointment changes
    watch(() => props.appointment, async (newAppointment) => {
      console.log('Appointment prop changed:', newAppointment)
      if (newAppointment) {
        const appointmentDate = new Date(newAppointment.appointment_date)        // Per tutti i modi, convertiamo l'orario in formato HH:MM string con padding
        const hours = appointmentDate.getHours().toString().padStart(2, '0')
        const minutes = appointmentDate.getMinutes().toString().padStart(2, '0')
        const appointmentTime = `${hours}:${minutes}`

        formData.value = {
          patient_id: newAppointment.patient_id,
          patient_full_name: newAppointment.patient_full_name || '',
          patient_email: newAppointment.patient_email || '',
          patient_codice_fiscale: newAppointment.patient_codice_fiscale || '',
          patient_phone: newAppointment.patient_phone || '',
          doctor_id: newAppointment.doctor_id,
          service_id: newAppointment.service_id,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status: newAppointment.status || 'scheduled',
          notes: newAppointment.notes || '',
          customFields: newAppointment.customFields || []
        }

        console.log('Form data populated:', formData.value)

        // Aspetta che i dati iniziali siano caricati prima di inizializzare i filtri
        if (allServices.value.length > 0) {
          initializeFiltersForAppointment(newAppointment)
        } else {
          // Se i servizi non sono ancora caricati, aspetta
          const checkServices = setInterval(() => {
            if (allServices.value.length > 0) {
              clearInterval(checkServices)
              initializeFiltersForAppointment(newAppointment)
            }
          }, 100)

          // Timeout di sicurezza
          setTimeout(() => clearInterval(checkServices), 5000)
        }

        // Carica gli slot per l'appuntamento esistente se non in modalità view
        if (props.mode !== 'view' && newAppointment.doctor_id && newAppointment.appointment_date) {
          await loadDoctorAvailability(newAppointment.doctor_id)
          await loadBookedSlotsForDate(newAppointment.appointment_date, newAppointment.doctor_id)
          generateAvailableTimeSlots()
        }
      } else {
        // Reset form for new appointment
        const now = new Date()
        let appointmentDate = now
        let appointmentTime = null // Start with null for Select component

        // Handle preselected date and hour
        if (props.preselectedDate) {
          appointmentDate = new Date(props.preselectedDate)
        }

        if (props.preselectedHour !== null) {
          // Convert preselected hour from decimal to HH:MM format
          const hours = Math.floor(props.preselectedHour)
          const minutes = Math.round((props.preselectedHour - hours) * 60)
          appointmentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

          if (props.preselectedDate) {
            appointmentDate.setHours(hours, minutes, 0, 0)
          }
        }
        
        formData.value = {
          patient_id: null,
          patient_full_name: '',
          patient_email: '',
          patient_codice_fiscale: '',
          patient_phone: '',
          doctor_id: null,
          service_id: null,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status: 'scheduled',
          notes: '',
          customFields: []
        }

        // Reset filters for new appointment
        resetFilters()
      }
      errors.value = {}
    }, { immediate: true })

    // Watch for mode changes (view -> edit)
    watch(() => props.mode, (newMode, oldMode) => {
      console.log('Mode changed from', oldMode, 'to', newMode)

      if (oldMode === 'view' && newMode === 'edit' && props.appointment) {
        // Ora che l'orario è sempre in formato string, non serve conversione
        console.log('Switched to edit mode, appointment_time:', formData.value.appointment_time)

        // Ricarica i dati necessari per la modalità edit
        if (formData.value.doctor_id) {
          loadDoctorAvailability(formData.value.doctor_id)

          if (formData.value.appointment_date) {
            loadBookedSlotsForDate(formData.value.appointment_date, formData.value.doctor_id)
              .then(() => generateAvailableTimeSlots())
          }
        }
      }
    })

    const validateForm = () => {
      errors.value = {}

      // Il paziente può essere selezionato dall'archivio O inserito manualmente
      if (!formData.value.patient_id && !formData.value.patient_full_name.trim()) {
        errors.value.patient_full_name = 'Il nome del paziente è obbligatorio'
      }

      // Validazione email (opzionale ma se inserita deve essere valida)
      if (formData.value.patient_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.patient_email)) {
        errors.value.patient_email = 'Email non valida'
      }

      // Validazione codice fiscale (opzionale ma se inserito deve essere valido)
      if (formData.value.patient_codice_fiscale &&
        formData.value.patient_codice_fiscale.length > 0 &&
        formData.value.patient_codice_fiscale.length !== 16) {
        errors.value.patient_codice_fiscale = 'Il codice fiscale deve essere di 16 caratteri'
      }

      if (!formData.value.doctor_id) {
        errors.value.doctor_id = 'Il medico è obbligatorio'
      }

      if (!formData.value.service_id) {
        errors.value.service_id = 'La prestazione è obbligatoria'
      }

      if (!formData.value.appointment_date) {
        errors.value.appointment_date = 'La data è obbligatoria'
      }

      if (!formData.value.appointment_time) {
        errors.value.appointment_time = 'L\'orario è obbligatorio'
      } else if (props.mode !== 'view' && availableTimeSlots.value.length > 0) {
        // Verifica che l'orario selezionato sia effettivamente disponibile
        const isValidSlot = availableTimeSlots.value.some(slot => slot.value === formData.value.appointment_time)
        if (!isValidSlot) {
          errors.value.appointment_time = 'L\'orario selezionato non è disponibile'
        }
      }

      return Object.keys(errors.value).length === 0
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      } try {
        loading.value = true        // Combine date and time
        const appointmentDateTime = new Date(formData.value.appointment_date)

        // Ora l'orario è sempre in formato stringa HH:MM
        if (formData.value.appointment_time && typeof formData.value.appointment_time === 'string') {
          const [hours, minutes] = formData.value.appointment_time.split(':').map(Number)
          appointmentDateTime.setHours(hours, minutes, 0, 0)
        } const submitData = {
          patient_id: formData.value.patient_id,
          patient_full_name: formData.value.patient_full_name.trim(),
          patient_email: formData.value.patient_email || null,
          patient_codice_fiscale: formData.value.patient_codice_fiscale?.toUpperCase() || null,
          patient_phone: formData.value.patient_phone || null,
          doctor_id: formData.value.doctor_id,
          service_id: formData.value.service_id,
          appointment_date: appointmentDateTime.toISOString(),
          status: formData.value.status,
          notes: formData.value.notes,
          customFields: formData.value.customFields || []
        }

        console.log('Submitting appointment data:', {
          originalDate: formData.value.appointment_date,
          originalTime: formData.value.appointment_time,
          combinedDateTime: appointmentDateTime,
          isoString: appointmentDateTime.toISOString()
        })

        emit('save', submitData)
      } catch (error) {
        console.error('Error in form submission:', error)
      } finally {
        loading.value = false
      }
    }

    const switchToEditMode = () => {
      emit('switch-mode', 'edit')
    }

    const confirmDelete = () => {
      confirm.require({
        message: 'Sei sicuro di voler eliminare questo appuntamento?',
        header: 'Conferma Eliminazione',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Elimina',
        rejectLabel: 'Annulla',
        accept: () => emit('delete', props.appointment.id)
      })
    }

    const formatDateTime = (dateString) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    const formatTimeForDisplay = (timeValue) => {
      if (!timeValue) return '-'

      // Se è già una stringa HH:MM, restituiscila così com'è
      if (typeof timeValue === 'string' && timeValue.includes(':')) {
        return timeValue
      }

      // Se è un oggetto Date, estrai ore e minuti con padding
      if (timeValue instanceof Date) {
        const hours = timeValue.getHours().toString().padStart(2, '0')
        const minutes = timeValue.getMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
      }

      return '-'
    }

    const resetPatientSelection = () => {
      formData.value.patient_id = null
      formData.value.patient_full_name = ''
      formData.value.patient_email = ''
      formData.value.patient_codice_fiscale = ''
      formData.value.patient_phone = ''
    }
    
    // Funzioni per la gestione dei campi personalizzati
    const addCustomField = () => {
      formData.value.customFields.push({
        title: '',
        value: ''
      })
    }

    const removeCustomField = (index) => {
      formData.value.customFields.splice(index, 1)
    }

    return {
      formData,
      errors,
      loading,
      loadingData,
      loadingSlots,
      statusOptions,
      patientOptions,
      doctorOptions,
      serviceOptions,
      allServices,
      filteredServices,
      filteredDoctors,
      selectedDoctor,
      doctorAvailability,
      bookedSlots,
      availableTimeSlots,
      handleSubmit,
      switchToEditMode,
      confirmDelete,
      formatDateTime,
      formatTimeForDisplay,
      resetFilters,
      resetPatientSelection,
      addCustomField,
      removeCustomField,
      loadDoctorAvailability,
      loadBookedSlotsForDate,
      generateAvailableTimeSlots,
      getDayLabel,
      initializeFiltersForAppointment
    }
  }
})
</script>

<style scoped>
.appointment-form {
  padding: 1rem 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem 1rem;
  margin-bottom: 2rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field-full {
  grid-column: 1 / -1;
}

.field-label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.875rem;
}

.appointment-details {
  margin-top: 1.5rem;
}

.appointment-details h4 {
  margin: 1rem 0;
  color: var(--text-color);
  font-size: 1.125rem;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color-secondary);
}

.detail-item span {
  color: var(--text-color);
  font-weight: 500;
}

.appointment-code {
  background: var(--primary-100) !important;
  color: var(--primary-700) !important;
  font-family: monospace;
  font-weight: 600;
  text-align: center;
  letter-spacing: 1px;
}

.code-field {
  background: var(--primary-50) !important;
  color: var(--primary-700) !important;
  font-family: monospace;
  font-weight: 600;
  text-align: center;
  letter-spacing: 1px;
  border: 2px solid var(--primary-200) !important;
}

.time-display-field {
  background: var(--surface-100) !important;
  color: var(--text-color) !important;
  font-weight: 600;
  text-align: center;
  font-size: 1.1rem;
}

.field-help {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-style: italic;
}

/* Styling per i campi di orario */
.p-select[disabled],
.p-datepicker[disabled] {
  opacity: 0.6;
}

.p-select.p-component.p-invalid,
.p-datepicker.p-component.p-invalid {
  border-color: var(--red-400);
}

.service-field-container {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.service-display {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.service-select {
  flex: 1;
}

.patient-field-container {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.patient-select {
  flex: 1;
}

.reset-filter-btn,
.reset-patient-btn {
  margin-top: 0.125rem;
  color: var(--text-color-secondary) !important;
}

.reset-filter-btn:hover,
.reset-patient-btn:hover {
  color: var(--primary-color) !important;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 1px solid var(--surface-200);
}

.action-buttons-right {
  display: flex;
  gap: 1rem;
}

/* Styling per i campi paziente */
.patient-section {
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
  border: 1px solid var(--surface-200);
  margin-bottom: 1rem;
}

.patient-section .field-label {
  color: var(--primary-600);
  font-weight: 600;
}

/* Styling per la sezione appuntamento */
.appointment-section {
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
  border: 1px solid var(--surface-200);
  margin-bottom: 1rem;
}

.appointment-section .field-label {
  color: var(--primary-600);
  font-weight: 600;
}

.appointment-section h4,
.patient-section h4 {
  margin: 0 0 1rem 0;
  color: var(--primary-700);
  font-size: 1.1rem;
  font-weight: 600;
  border-bottom: 2px solid var(--primary-200);
  padding-bottom: 0.5rem;
}

/* Styling per i campi personalizzati */
.custom-fields-section {
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
  border: 1px solid var(--surface-200);
  margin-bottom: 1rem;
}

.custom-fields-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.custom-fields-header h4 {
  margin: 0;
  color: var(--primary-700);
  font-size: 1.1rem;
  font-weight: 600;
}

.custom-fields-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.custom-field-item {
  padding: 1rem;
  background: var(--surface-0);
  border: 1px solid var(--surface-300);
  border-radius: 6px;
}

.custom-field-controls {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: end;
}

.custom-field-value {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-actions {
  display: flex;
  align-items: end;
  padding-bottom: 0.25rem;
}

.empty-custom-fields {
  text-align: center;
  color: var(--text-color-secondary);
  font-style: italic;
  padding: 2rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .action-buttons-right {
    justify-content: center;
    flex-wrap: wrap;
  }

  .form-actions .p-button {
    width: 100%;
  }

  .action-buttons-right .p-button {
    flex: 1;
    min-width: 120px;
  }
}
</style>
