import { server } from './server'

const PORT = process.env.PORT || 3000
const app = server()

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export { server }
