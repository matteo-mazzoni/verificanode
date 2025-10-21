import List from '../models/List.js';

// Ottiene tutte le liste dell'utente
export const getLists = async (req, res) => {
  try {
    const lists = await List.findAll({
      where: { userId: req.session.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(lists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({ message: 'Errore nel recupero delle liste' });
  }
};

// Aggiorna una lista esistente
export const updateList = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Il titolo è obbligatorio' });
    }
    
    const list = await List.findOne({
      where: { 
        id: req.params.id,
        userId: req.session.user.id 
      }
    });
    
    if (!list) {
      return res.status(404).json({ message: 'Lista non trovata' });
    }
    
    await list.update({
      title,
      description
    });
    
    res.redirect(`/lists/${list.id}`);
  } catch (error) {
    console.error('Error updating list:', error);
    res.status(500).send('Errore nell\'aggiornamento della lista');
  }
};

// Funzione per renderizzare la pagina di modifica della lista
export const renderEditList = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Trova la lista
    const list = await List.findOne({
      where: {
        id: id,
        userId: req.session.user.id
      }
    });
    
    if (!list) {
      return res.redirect('/lists');
    }
    
    res.render('edit-list', { 
      username: req.session.user.username,
      list: list
    });
  } catch (error) {
    console.error('Errore durante il rendering della pagina di modifica:', error);
    res.redirect('/lists');
  }
};

// Crea una nuova lista
export const createList = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Il titolo è obbligatorio' });
    }
    
    const newList = await List.create({
      title,
      description,
      content: [],
      userId: req.session.user.id
    });
    
    res.redirect('/lists');
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).send('Errore nella creazione della lista');
  }
};

// Ottiene una lista specifica
export const getList = async (req, res) => {
  try {
    const list = await List.findOne({
      where: { 
        id: req.params.id,
        userId: req.session.user.id 
      }
    });
    
    if (!list) {
      return res.status(404).json({ message: 'Lista non trovata' });
    }
    
    res.render('list-detail', { list, username: req.session.user.username });
  } catch (error) {
    console.error('Error fetching list:', error);
    res.status(500).send('Errore nel recupero della lista');
  }
};

// Elimina una lista
export const deleteList = async (req, res) => {
  try {
    const list = await List.findOne({
      where: { 
        id: req.params.id,
        userId: req.session.user.id 
      }
    });
    
    if (!list) {
      return res.status(404).json({ message: 'Lista non trovata' });
    }
    
    await list.destroy();
    
    res.redirect('/lists');
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).send('Errore nell\'eliminazione della lista');
  }
};

// Aggiunge un elemento alla lista
export const addItemToList = async (req, res) => {
  try {
    let mediaItem = req.body.mediaItem;
    
    // Se mediaItem è una stringa, prova a parsificarla
    if (typeof mediaItem === 'string') {
      try {
        mediaItem = JSON.parse(mediaItem);
      } catch (err) {
        console.error('Error parsing mediaItem:', err);
      }
    }
    
    // Se non c'è mediaItem nel body, prova a prenderla dalla query
    if (!mediaItem && req.query.movie) {
      try {
        mediaItem = JSON.parse(decodeURIComponent(req.query.movie));
      } catch (err) {
        console.error('Error parsing movie from query:', err);
      }
    }
    
    if (!mediaItem || !mediaItem.id) {
      return res.status(400).json({ message: 'Dati del media non validi' });
    }
    
    const list = await List.findOne({
      where: { 
        id: req.params.id,
        userId: req.session.user.id 
      }
    });
    
    if (!list) {
      return res.status(404).json({ message: 'Lista non trovata' });
    }
    
    // Verifica se l'elemento è già presente nella lista
    const content = list.content || [];
    const itemExists = content.some(item => item.id === mediaItem.id);
    
    if (itemExists) {
      return res.status(400).json({ message: 'Questo elemento è già presente nella lista' });
    }
    
    // Aggiungi l'elemento alla lista
    list.content = [...content, mediaItem];
    await list.save();
    
    res.redirect(`/lists/${list.id}`);
  } catch (error) {
    console.error('Error adding item to list:', error);
    res.status(500).send('Errore nell\'aggiunta dell\'elemento alla lista');
  }
};

// Rimuove un elemento dalla lista
export const removeItemFromList = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({ message: 'ID dell\'elemento non valido' });
    }
    
    const list = await List.findOne({
      where: { 
        id: req.params.id,
        userId: req.session.user.id 
      }
    });
    
    if (!list) {
      return res.status(404).json({ message: 'Lista non trovata' });
    }
    
    // Rimuovi l'elemento dalla lista
    const content = list.content || [];
    list.content = content.filter(item => item.id !== parseInt(itemId));
    await list.save();
    
    res.redirect(`/lists/${list.id}`);
  } catch (error) {
    console.error('Error removing item from list:', error);
    res.status(500).send('Errore nella rimozione dell\'elemento dalla lista');
  }
};

// Mostra la pagina delle liste
export const showLists = async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) return res.redirect('/login');

    const lists = await List.findAll({
      where: { userId: sessionUser.id },
      order: [['createdAt', 'DESC']]
    });

    return res.render('lists', { 
      username: sessionUser.username, 
      lists 
    });
  } catch (error) {
    console.error('showLists error:', error);
    return res.status(500).send('Errore durante il caricamento delle liste');
  }
};