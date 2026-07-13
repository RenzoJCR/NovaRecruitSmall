package com.novarecruit.backend.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.novarecruit.backend.dto.UsuarioRequest;
import com.novarecruit.backend.dto.UsuarioResponse;
import com.novarecruit.backend.entity.Usuario;
import com.novarecruit.backend.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    // Listar todos los usuarios en orden ascendente
    @Transactional(readOnly = true)
    public List<UsuarioResponse> listarTodos() {
        return usuarioRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // Buscar un usuario específico por su ID físico
    @Transactional(readOnly = true)
    public UsuarioResponse obtenerPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        return mapToResponse(usuario);
    }

    // Crear un usuario desde el panel administrativo (ej: un nuevo Administrador)
    @Transactional
    public UsuarioResponse crearUsuario(UsuarioRequest request, String correoOperador) {
        if (usuarioRepository.existsByCorreo(request.correo().trim().toLowerCase())) {
            throw new RuntimeException("El correo electrónico ya se encuentra registrado.");
        }

        Usuario usuario = new Usuario();
        usuario.setNombres(request.nombres().trim());
        usuario.setApellidos(request.apellidos().trim());
        usuario.setCorreo(request.correo().trim().toLowerCase());
        // Encriptación hash de la clave digitada por el Administrador
        usuario.setPassword(passwordEncoder.encode(request.password().trim()));
        
        // Asignamos el Rol directo como String ("ADMINISTRADOR" o "POSTULANTE")
        usuario.setRol(request.rol().toUpperCase().trim());
        usuario.setCvUrl(request.cvUrl() != null ? request.cvUrl().trim() : null);
        usuario.setActivo(true); // Por defecto, el usuario está activo
        usuario.setCreadoPor(correoOperador); // Guardamos la auditoría real

        Usuario guardado = usuarioRepository.save(usuario);
        return mapToResponse(guardado);
    }

    // Actualizar datos de perfil (Evitando romper la contraseña si viene vacía)
    @Transactional
    public UsuarioResponse actualizarUsuario(Long id, UsuarioRequest request, String correoOperador) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
        Usuario operador = usuarioRepository.findByCorreo(correoOperador)
            .orElseThrow(() -> new RuntimeException("Usuario operador no encontrado."));

        usuario.setNombres(request.nombres().trim());
        usuario.setApellidos(request.apellidos().trim());
        usuario.setCorreo(request.correo().trim().toLowerCase());
        
        // Si el administrador digita una nueva clave, la actualizamos; si no, dejamos la actual intacta
        if (request.password() != null && !request.password().trim().isEmpty()) {
            usuario.setPassword(passwordEncoder.encode(request.password().trim()));
        }

        if (request.rol() != null) {
            String nuevoRol = request.rol().toUpperCase().trim();

            if (operador.getId().equals(usuario.getId()) && !"ADMINISTRADOR".equals(nuevoRol)) {
                throw new RuntimeException("No puedes cambiar tu propio rol a un perfil no administrador.");
            }

            usuario.setRol(nuevoRol);
        }

        Usuario actualizado = usuarioRepository.save(usuario);
        return mapToResponse(actualizado);
    }

    // BORRADO LÓGICO: Modifica el estado del flag o rol para inhabilitarlo (ej. usando prefijo o un campo si lo tienes)
    @Transactional
    public void desactivarUsuario(Long id, String correoOperador) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
        Usuario operador = usuarioRepository.findByCorreo(correoOperador)
                .orElseThrow(() -> new RuntimeException("Usuario operador no encontrado."));

        if (operador.getId().equals(usuario.getId())) {
            throw new RuntimeException("No puedes deshabilitar tu propia cuenta desde el panel.");
        }

        usuario.setActivo(false); // Marcamos como inactivo
        usuarioRepository.save(usuario);
    }

    @Transactional
    public UsuarioResponse reactivarUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        usuario.setActivo(true); // Marcamos como activo
        return mapToResponse(usuarioRepository.save(usuario));
    }

    // Convertidor manual de Entidad a DTO Record
    private UsuarioResponse mapToResponse(Usuario usuario) {
        String nombreCompleto = usuario.getNombres() + " " + usuario.getApellidos();
        return new UsuarioResponse(
            usuario.getId(),
            usuario.getNombres(),
            usuario.getApellidos(),
            nombreCompleto,
            usuario.getCorreo(),
            usuario.getRol(),
            usuario.getCvUrl(),
            usuario.isActivo(), // Si no agregas la columna, puedes hardcodear provisionalmente 'true'
            usuario.getFechaCreacion()
        );
        }
}