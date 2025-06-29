import { Request, Response } from 'express';
import { Campsite } from '../../models/campsiteModel';
import * as campsitesService from '../../services/campsites/campsitesService';

export const getCampsites = async (req: Request, res: Response) => {
  try {
    const campsites = await campsitesService.getCampsites();
    res.status(200).json(campsites);
  } catch (error) {
    console.error('Error in getCampsites controller:', error);
    res.status(500).json({ 
      error: 'Unable to fetch campsites',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const addCampsite = async (req: Request, res: Response) => {
  try {
    const { id, name, description, lat, lng, requires_4wd, last_updated } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'id is required and must be a string' });
    }
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required and must be a string' });
    }
    
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'description is required and must be a string' });
    }
    
    if (typeof lat !== 'number' || isNaN(lat)) {
      return res.status(400).json({ error: 'lat is required and must be a valid number' });
    }
    
    if (typeof lng !== 'number' || isNaN(lng)) {
      return res.status(400).json({ error: 'lng is required and must be a valid number' });
    }
    
    if (typeof requires_4wd !== 'boolean') {
      return res.status(400).json({ error: 'requires_4wd is required and must be a boolean' });
    }
    
    if (!last_updated || typeof last_updated !== 'string') {
      return res.status(400).json({ error: 'last_updated is required and must be a string' });
    }

    const campsiteData = {
      id,
      name,
      description,
      lat,
      lng,
      requires_4wd,
      last_updated,
    };

    const newCampsite = await campsitesService.addCampsite({ ...campsiteData });
    res.status(201).json(newCampsite);
  } catch (error) {
    console.error('Error in addCampsite controller:', error);
    res.status(500).json({ 
      error: 'Unable to create campsite',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateCampsite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, lat, lng, requires_4wd, last_updated } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'id is required and must be a string' });
    }
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required and must be a string' });
    }
    
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'description is required and must be a string' });
    }
    
    if (typeof lat !== 'number' || isNaN(lat)) {
      return res.status(400).json({ error: 'lat is required and must be a valid number' });
    }
    
    if (typeof lng !== 'number' || isNaN(lng)) {
      return res.status(400).json({ error: 'lng is required and must be a valid number' });
    }
    
    if (typeof requires_4wd !== 'boolean') {
      return res.status(400).json({ error: 'requires_4wd is required and must be a boolean' });
    }
    
    if (!last_updated || typeof last_updated !== 'string') {
      return res.status(400).json({ error: 'last_updated is required and must be a string' });
    }

    const campsiteData = {
      id,
      name,
      description,
      lat,
      lng,
      requires_4wd,
      last_updated,
    };

    const updatedCampsite = await campsitesService.updateCampsite(id, { ...campsiteData });
    
    if (!updatedCampsite) {
      return res.status(404).json({ error: 'Campsite not found' });
    }
    
    res.status(200).json(updatedCampsite);
  } catch (error) {
    console.error('Error in updateCampsite controller:', error);
    res.status(500).json({ 
      error: 'Unable to update campsite',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteCampsite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'id is required and must be a string' });
    }
    const deleted = await campsitesService.deleteCampsite(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Campsite not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteCampsite controller:', error);
    res.status(500).json({
      error: 'Unable to delete campsite',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};