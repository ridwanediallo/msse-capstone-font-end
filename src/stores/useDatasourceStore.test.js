import { beforeEach, describe, expect, it } from 'vitest'
import useDatasourceStore from './useDatasourceStore'

const resetStore = () => {
  useDatasourceStore.setState({
    datasources: [],
    selectedDatasourceId: null,
    currentDatasource: null,
    loading: false,
    error: null,
  })
}

describe('useDatasourceStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('fetchDatasources', () => {
    it('loads the datasource list', async () => {
      await useDatasourceStore.getState().fetchDatasources()
      const state = useDatasourceStore.getState()
      expect(state.datasources).toHaveLength(2)
      expect(state.datasources[0].name).toBe('school')
      expect(state.loading).toBe(false)
    })
  })

  describe('fetchDatasource', () => {
    it('loads a single datasource', async () => {
      const ds = await useDatasourceStore.getState().fetchDatasource('ds-1')
      expect(ds.id).toBe('ds-1')
      expect(useDatasourceStore.getState().currentDatasource.id).toBe('ds-1')
    })

    it('returns null on missing datasource', async () => {
      const ds = await useDatasourceStore.getState().fetchDatasource('nope')
      expect(ds).toBeNull()
    })
  })

  describe('selectDatasource', () => {
    it('updates the selected id', () => {
      useDatasourceStore.getState().selectDatasource('ds-2')
      expect(useDatasourceStore.getState().selectedDatasourceId).toBe('ds-2')
    })
  })

  describe('testConnection', () => {
    it('returns the server response', async () => {
      const result = await useDatasourceStore
        .getState()
        .testConnection({ host: 'localhost' })
      expect(result).toMatchObject({ success: true })
    })
  })

  describe('createDatasource', () => {
    it('creates and refreshes the list', async () => {
      const result = await useDatasourceStore.getState().createDatasource({
        name: 'new-ds',
        host: 'localhost',
      })
      expect(result.ok).toBe(true)
      expect(result.data.id).toBe('ds-new')
      expect(useDatasourceStore.getState().datasources).toHaveLength(2)
    })
  })

  describe('introspectSchema', () => {
    it('returns catalog entries', async () => {
      const result = await useDatasourceStore.getState().introspectSchema('ds-1')
      expect(result.ok).toBe(true)
      expect(result.data[0].table_name).toBe('customers')
    })
  })

  describe('updateSchemaEntry', () => {
    it('returns the updated entry', async () => {
      const result = await useDatasourceStore
        .getState()
        .updateSchemaEntry('ds-1', 'cat-1', { description: 'x' })
      expect(result.ok).toBe(true)
      expect(result.data.id).toBe('cat-1')
    })
  })

  describe('deleteDatasource', () => {
    it('deletes and refreshes the list', async () => {
      const result = await useDatasourceStore.getState().deleteDatasource('ds-1')
      expect(result.ok).toBe(true)
      expect(useDatasourceStore.getState().datasources).toHaveLength(2)
    })
  })

  describe('reset', () => {
    it('clears the list and selection for a new identity', () => {
      useDatasourceStore.setState({
        datasources: [{ id: 'ds-2' }],
        selectedDatasourceId: 'ds-2',
        currentDatasource: { id: 'ds-2' },
        loading: true,
        error: 'stale',
      })

      useDatasourceStore.getState().reset()

      const state = useDatasourceStore.getState()
      expect(state.datasources).toHaveLength(0)
      expect(state.selectedDatasourceId).toBeNull()
      expect(state.currentDatasource).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
